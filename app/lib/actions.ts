"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import postgres from "postgres";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import {
  saveFileToDisk,
  getFileChecksum,
  saveFileToDiskWithUUID,
} from "@/app/lib/utils-files";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: false });

const MAX_FILE_SIZE = 2 * 1024 * 1024; //2MB
const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "application/pdf"];

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
  /*
  documentName: z
    .string({
      invalid_type_error: "Please enter document name.",
    })
    .min(1, { message: "document name must not be empty." }),
  */
  documentDescription: z
    .string({
      invalid_type_error: "Please enter document description.",
    })
    .min(1, { message: "document description must not be empty." })
    .toLowerCase()
    .transform((val) => val.trim().replace(/\s+/g, " ")),

  /*  
  documentPath: z
    .string({
      invalid_type_error: "Please select document path.",
    })
    .min(1, { message: "document path must not be empty." }),
  */
  date: z.string(),
  // ✅ File validation
  documentFile: z
    .any()
    .refine((file) => file !== undefined && file !== null, {
      message: "File is required",
    })
    .refine((file) => file instanceof File, {
      message: "Invalid file type",
    })
    //.refine((file) => file.size <= 2 * 1024 * 1024, {
    .refine((file) => file.size <= MAX_FILE_SIZE, {
      message: "File size must be under 2MB",
    })
    .refine(
      (file) =>
        //["image/png", "image/jpeg", "application/pdf"].includes(file.type),
        ACCEPTED_IMAGE_TYPES.includes(file.type),
      {
        message: "Only PNG, JPEG, or PDF files are allowed",
      }
    ),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
// Use Zod to update the expected types
const UpdateInvoice = FormSchema.omit({ id: true, date: true });
const CreateCustomer = CustomerFormSchema.omit({ id: true });
const UpdateCustomer = CustomerFormSchema.omit({ id: true });
const CreateDocument = DocumentFormSchema.omit({ id: true, date: true });
// const UpdateDocument = DocumentFormSchema.omit({ id: true, date: true });
const UpdateDocument = DocumentFormSchema.omit({
  id: true,
  date: true,
  documentFile: true,
});
const VerifyDocument = DocumentFormSchema.omit({
  id: true,
  customerId: true,
  documentType: true,
  documentDescription: true,
  date: true,
});

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
    //documentName: formData.get("documentName"),
    documentDescription: formData.get("documentDescription"),
    //documentPath: formData.get("documentPath"),
    documentFile: formData.get("documentFile"),
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
    //documentName,
    documentDescription,
    //documentPath,
    documentFile,
  } = validatedFields.data;
  const date = new Date().toISOString().split("T")[0];

  // Insert data into the database
  try {
    const documentName = documentFile.name;
    const { success, filePath } = await saveFileToDisk(documentFile);
    if (success) {
      const documentPath = filePath;
      const documentFileChecksum = await getFileChecksum(filePath);

      await sql`
        INSERT INTO documents (customer_id, document_type, document_name, document_description, document_path, document_file_check_sum, date)
        VALUES (${customerId}, ${documentType}, ${documentName}, ${documentDescription}, ${documentPath}, ${documentFileChecksum}, ${date})
      `;
    } else {
      console.log("File ${documentName} failed to be saved.");
    }
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
    //documentPath: formData.get("documentPath"),
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
    //documentPath,
  } = validatedFields.data;

  // document_path = ${documentPath}

  try {
    await sql`
      UPDATE documents
      SET customer_id = ${customerId}, document_type = ${documentType}, 
      document_name = ${documentName}, document_description = ${documentDescription}
      WHERE id = ${id}
    `;
  } catch (error) {
    return { message: "Database Error: Failed to Update Document." };
  }

  revalidatePath("/dashboard/documents");
  redirect("/dashboard/documents");
}

export async function verifyDocument(
  id: string,
  prevState: State,
  formData: FormData
) {
  // Validate form using Zod
  const validatedFields = VerifyDocument.safeParse({
    /*
    customerId: formData.get("customerId"),
    documentType: formData.get("documentType"),
    documentDescription: formData.get("documentDescription"),
    */
    documentFile: formData.get("documentFile"),
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Document.",
    };
  }

  // Prepare data for insertion into the database
  const { documentFile } = validatedFields.data;

  // Query the database
  try {
    const documentName = documentFile.name;
    const { success, filePath } = await saveFileToDiskWithUUID(documentFile);
    if (success && filePath != null) {
      const documentPath = filePath;
      const documentFileChecksum = await getFileChecksum(filePath);

      const data = await sql`SELECT COUNT(*)
        FROM documents
        WHERE id = ${id} and
        document_file_check_sum = ${documentFileChecksum}
      `;

      const count = data[0].count;
      console.log("id: ", id);
      console.log("documentPath: ", documentPath);
      console.log("count: ", count);
      console.log("documentFileChecksum: ", documentFileChecksum);
      var message = "";
      if (count > 0) {
        message = `Document ${documentName} verified successfully!`;
      } else {
        message = `Document ${documentName} failed to be verified!`;
      }
      return {
        errors: null, //new Error("test error"),
        message: message,
      };
    } else {
      console.log("File ${documentName} failed to be saved.");
    }
  } catch (error) {
    // We'll log the error to the console for now
    console.error(error);
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
