"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import postgres from "postgres";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: false });

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: "Please select a customer.",
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: "Please enter an amount greater than $0." }),
  status: z.enum(["pending", "paid"], {
    invalid_type_error: "Please select an invoice status.",
  }),
  date: z.string(),
});

const CustomerFormSchema = z.object({
  id: z.string(),
  name: z
    .string({
      invalid_type_error: "Please enter customer name.",
    })
    .min(1, { message: "Customer name must not be empty." }),
  email: z
    .string({
      invalid_type_error: "Please enter email.",
    })
    .min(1, { message: "Email must not be empty." }),
  image: z
    .string({
      invalid_type_error: "Please enter image url.",
    })
    .min(1, { message: "Image url must not be empty." }),
});

const DocumentFormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: "Please select a customer.",
  }),
  documentType: z.enum(["agreement", "title deed", "last will"], {
    invalid_type_error: "Please select document type.",
  }),
  documentName: z
    .string({
      invalid_type_error: "Please enter document name.",
    })
    .min(1, { message: "document name must not be empty." }),
  documentDescription: z
    .string({
      invalid_type_error: "Please enter document description.",
    })
    .min(1, { message: "document name must not be empty." }),
  documentPath: z
    .string({
      invalid_type_error: "Please select document path.",
    })
    .min(1, { message: "document path must not be empty." }),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
// Use Zod to update the expected types
const UpdateInvoice = FormSchema.omit({ id: true, date: true });
const CreateCustomer = CustomerFormSchema.omit({ id: true });
const UpdateCustomer = CustomerFormSchema.omit({ id: true });
const CreateDocument = DocumentFormSchema.omit({ id: true, date: true });
const UpdateDocument = DocumentFormSchema.omit({ id: true, date: true });

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

export type CustomerState = {
  errors?: {
    name?: string[];
    email?: string[];
    image?: string[];
  };
  message?: string | null;
};

export async function createInvoice(prevState: State, formData: FormData) {
  // Validate form using Zod
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Invoice.",
    };
  }

  // Prepare data for insertion into the database
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split("T")[0];

  // Insert data into the database
  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
  } catch (error) {
    // We'll log the error to the console for now
    console.error(error);
  }

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData
) {
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Update Invoice.",
    };
  }

  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;

  try {
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;
  } catch (error) {
    return { message: "Database Error: Failed to Update Invoice." };
  }

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function deleteInvoice(id: string) {
  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
  } catch (error) {
    // We'll log the error to the console for now
    console.error(error);
  }
  revalidatePath("/dashboard/invoices");
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData
) {
  try {
    await signIn("credentials", formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid credentials.";
        default:
          return "Something went wrong.";
      }
    }
    throw error;
  }
}

export async function createCustomer(
  prevState: CustomerState,
  formData: FormData
) {
  // Validate form using Zod
  const validatedFields = CreateCustomer.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    image: formData.get("image"),
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Customer.",
    };
  }

  // Prepare data for insertion into the database
  const { name, email, image } = validatedFields.data;

  // Insert data into the database
  try {
    await sql`
      INSERT INTO customers (name, email, image_url)
      VALUES (${name}, ${email}, ${image})
    `;
  } catch (error) {
    // We'll log the error to the console for now
    console.error(error);
  }

  revalidatePath("/dashboard/customers");
  redirect("/dashboard/customers");
}

export async function updateCustomer(
  id: string,
  prevState: State,
  formData: FormData
) {
  const validatedFields = UpdateCustomer.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    image: formData.get("image"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Update Invoice.",
    };
  }

  const { name, email, image } = validatedFields.data;

  try {
    await sql`
      UPDATE customers
      SET name = ${name}, email = ${email}, image_url = ${image}
      WHERE id = ${id}
    `;
  } catch (error) {
    return { message: "Database Error: Failed to Update Customer." };
  }

  revalidatePath("/dashboard/customers");
  redirect("/dashboard/customers");
}

export async function deleteCustomer(id: string) {
  try {
    await sql`DELETE FROM customers WHERE id = ${id}`;
  } catch (error) {
    // We'll log the error to the console for now
    console.error(error);
  }
  revalidatePath("/dashboard/customers");
}

export async function createDocument(prevState: State, formData: FormData) {
  // Validate form using Zod
  const validatedFields = CreateDocument.safeParse({
    customerId: formData.get("customerId"),
    documentType: formData.get("documentType"),
    documentName: formData.get("documentName"),
    documentDescription: formData.get("documentDescription"),
    documentPath: formData.get("documentPath"),
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Document.",
    };
  }

  // Prepare data for insertion into the database
  const {
    customerId,
    documentType,
    documentName,
    documentDescription,
    documentPath,
  } = validatedFields.data;
  const date = new Date().toISOString().split("T")[0];

  // Insert data into the database
  try {
    await sql`
      INSERT INTO documents (customer_id, document_type, document_name, document_description, document_path, date)
      VALUES (${customerId}, ${documentType}, ${documentName}, ${documentDescription}, ${documentPath}, ${date})
    `;
  } catch (error) {
    // We'll log the error to the console for now
    console.error(error);
  }

  revalidatePath("/dashboard/documents");
  redirect("/dashboard/documents");
}

export async function updateDocument(
  id: string,
  prevState: State,
  formData: FormData
) {
  const validatedFields = UpdateDocument.safeParse({
    customerId: formData.get("customerId"),
    documentType: formData.get("documentType"),
    documentName: formData.get("documentName"),
    documentDescription: formData.get("documentDescription"),
    documentPath: formData.get("documentPath"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Update Document.",
    };
  }

  const {
    customerId,
    documentType,
    documentName,
    documentDescription,
    documentPath,
  } = validatedFields.data;

  try {
    await sql`
      UPDATE documents
      SET customer_id = ${customerId}, document_type = ${documentType}, 
      document_name = ${documentName}, document_description = ${documentDescription},
      document_path = ${documentPath}
      WHERE id = ${id}
    `;
  } catch (error) {
    return { message: "Database Error: Failed to Update Document." };
  }

  revalidatePath("/dashboard/documents");
  redirect("/dashboard/documents");
}

export async function deleteDocument(id: string) {
  try {
    await sql`DELETE FROM documents WHERE id = ${id}`;
  } catch (error) {
    // We'll log the error to the console for now
    console.error(error);
  }
  revalidatePath("/dashboard/documents");
}
