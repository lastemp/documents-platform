import postgres from "postgres";
import {
  CustomerField,
  CustomersTableType,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  Revenue,
  DocumentsTable,
  DocumentForm,
} from "./definitions";
import { formatCurrency } from "./utils";
//const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });
const sql = postgres(process.env.POSTGRES_URL!, {
  ssl: false, // ← Explicitly disable SSL);
});

export async function fetchRevenue() {
  try {
    // Artificially delay a response for demo purposes.
    // Don't do this in production :)

    console.log("Fetching revenue data...");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const data = await sql<Revenue[]>`SELECT * FROM revenue`;

    console.log("Data fetch completed after 3 seconds.");

    return data;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch revenue data.");
  }
}

export async function fetchLatestInvoices() {
  try {
    const data = await sql<LatestInvoiceRaw[]>`
      SELECT invoices.amount, customers.name, customers.image_url, customers.email, invoices.id
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      ORDER BY invoices.date DESC
      LIMIT 5`;

    const latestInvoices = data.map((invoice) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
    }));
    return latestInvoices;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch the latest invoices.");
  }
}
/*
export async function fetchCardData() {
  try {
    // You can probably combine these into a single SQL query
    // However, we are intentionally splitting them to demonstrate
    // how to initialize multiple queries in parallel with JS.
    const invoiceCountPromise = sql`SELECT COUNT(*) FROM invoices`;
    const customerCountPromise = sql`SELECT COUNT(*) FROM customers`;
    const invoiceStatusPromise = sql`SELECT
         SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS "paid",
         SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS "pending"
         FROM invoices`;

    const data = await Promise.all([
      invoiceCountPromise,
      customerCountPromise,
      invoiceStatusPromise,
    ]);

    const numberOfInvoices = Number(data[0][0].count ?? "0");
    const numberOfCustomers = Number(data[1][0].count ?? "0");
    const totalPaidInvoices = formatCurrency(data[2][0].paid ?? "0");
    const totalPendingInvoices = formatCurrency(data[2][0].pending ?? "0");

    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
    };
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch card data.");
  }
}
*/
export async function fetchCardData() {
  try {
    // You can probably combine these into a single SQL query
    // However, we are intentionally splitting them to demonstrate
    // how to initialize multiple queries in parallel with JS.
    const documentCountPromise = sql`SELECT COUNT(*) FROM documents`;
    const customerCountPromise = sql`SELECT COUNT(*) FROM customers`;

    const data = await Promise.all([
      documentCountPromise,
      customerCountPromise,
    ]);

    const numberOfDocuments = Number(data[0][0].count ?? "0");
    const numberOfCustomers = Number(data[1][0].count ?? "0");

    return {
      numberOfCustomers,
      numberOfDocuments,
    };
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch card data.");
  }
}

const ITEMS_PER_PAGE = 6;
export async function fetchFilteredInvoices(
  query: string,
  currentPage: number
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const invoices = await sql<InvoicesTable[]>`
      SELECT
        invoices.id,
        invoices.amount,
        invoices.date,
        invoices.status,
        customers.name,
        customers.email,
        customers.image_url
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      WHERE
        customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`} OR
        invoices.amount::text ILIKE ${`%${query}%`} OR
        invoices.date::text ILIKE ${`%${query}%`} OR
        invoices.status ILIKE ${`%${query}%`}
      ORDER BY invoices.date DESC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;

    return invoices;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch invoices.");
  }
}

export async function fetchInvoicesPages(query: string) {
  try {
    const data = await sql`SELECT COUNT(*)
    FROM invoices
    JOIN customers ON invoices.customer_id = customers.id
    WHERE
      customers.name ILIKE ${`%${query}%`} OR
      customers.email ILIKE ${`%${query}%`} OR
      invoices.amount::text ILIKE ${`%${query}%`} OR
      invoices.date::text ILIKE ${`%${query}%`} OR
      invoices.status ILIKE ${`%${query}%`}
  `;

    const totalPages = Math.ceil(Number(data[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch total number of invoices.");
  }
}

export async function fetchInvoiceById(id: string) {
  try {
    const data = await sql<InvoiceForm[]>`
      SELECT
        invoices.id,
        invoices.customer_id,
        invoices.amount,
        invoices.status
      FROM invoices
      WHERE invoices.id = ${id};
    `;

    const invoice = data.map((invoice) => ({
      ...invoice,
      // Convert amount from cents to dollars
      amount: invoice.amount / 100,
    }));

    return invoice[0];
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch invoice.");
  }
}

export async function fetchCustomers() {
  try {
    const customers = await sql<CustomerField[]>`
      SELECT
        id,
        name
      FROM customers
      ORDER BY name ASC
    `;

    return customers;
  } catch (err) {
    console.error("Database Error:", err);
    throw new Error("Failed to fetch all customers.");
  }
}

export async function fetchCustomerById(id: string) {
  try {
    const customer = await sql<CustomerField>`
      SELECT
        id,
        name,
        email,
        image_url
      FROM customers
      WHERE id = ${id}
      LIMIT 1;
    `;

    return customer;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch customer.");
  }
}

export async function fetchFilteredCustomers(
  query: string,
  currentPage: number
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const data = await sql<CustomersTableType[]>`
      SELECT
        customers.id,
        customers.name,
        customers.email,
        customers.image_url,
        COUNT(invoices.id) AS total_invoices,
        SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
        SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_paid
      FROM customers
      LEFT JOIN invoices ON customers.id = invoices.customer_id
      WHERE
        customers.name ILIKE ${`%${query}%`} OR
          customers.email ILIKE ${`%${query}%`}
      GROUP BY customers.id, customers.name, customers.email, customers.image_url
      ORDER BY customers.name ASC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;

    const customers = data.map((customer) => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending),
      total_paid: formatCurrency(customer.total_paid),
    }));

    return customers;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch invoices.");
  }
}

export async function fetchCustomersPages(query: string) {
  try {
    const data = await sql`SELECT COUNT(*)
      FROM customers
      WHERE
        customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`}
    `;

    const totalPages = Math.ceil(Number(data[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch total number of invoices.");
  }
}

export async function fetchFilteredDocuments(
  query: string,
  currentPage: number
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const documents = await sql<DocumentsTable[]>`
      SELECT
        documents.id,
        documents.document_type as doc_type,
        documents.document_name as doc_name,
        documents.document_description as doc_description,
        documents.document_path as doc_path,
        documents.date,
        customers.name,
        customers.email,
        customers.image_url
      FROM documents
      JOIN customers ON documents.customer_id = customers.id
      WHERE
        customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`} OR
        documents.date::text ILIKE ${`%${query}%`}
      ORDER BY documents.date DESC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;

    return documents;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch documents.");
  }
}

export async function fetchDocumentsPages(query: string) {
  try {
    const data = await sql`SELECT COUNT(*)
    FROM documents
    JOIN customers ON documents.customer_id = customers.id
    WHERE
      customers.name ILIKE ${`%${query}%`} OR
      customers.email ILIKE ${`%${query}%`} OR
      documents.date::text ILIKE ${`%${query}%`}
  `;

    const totalPages = Math.ceil(Number(data[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    throw new Error("Failed to fetch total number of documents.");
  }
}

export async function fetchDocumentById(id: string) {
  try {
    const document = await sql<DocumentForm>`
      SELECT
        documents.id,
        documents.customer_id,
        documents.document_type as doc_type,
        documents.document_name as doc_name,
        documents.document_description as doc_description,
        documents.document_path as doc_path
      FROM documents
      WHERE documents.id = ${id}
      LIMIT 1;
    `;

    return document[0];
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch document.");
  }
}

export async function fetchDocumentFileChecksumCount(
  id: string,
  documentFileChecksum: string
) {
  try {
    const data = await sql`SELECT COUNT(*)
      FROM documents
      WHERE id = ${id} and
      document_file_check_sum = ${documentFileChecksum}
    `;

    const count = data[0].count;
    return count;
  } catch (error) {
    throw new Error("Failed to fetch count of document file checksum.");
  }
}
