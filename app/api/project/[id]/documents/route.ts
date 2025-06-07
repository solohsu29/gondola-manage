import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request, context: { params: { id: string } }) {
  const projectId = context.params.id;

  if (!projectId) {
    return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
  }

  try {
    // Ensure column names in the SQL query match your database schema exactly.
    // Quoted if they are case-sensitive or contain special characters.
    const query = `
      SELECT 
        id, 
        name, 
        type, 
        title,      -- User-provided title
        category,   -- User-provided category
        uploaded, 
        expiry, 
        status, 
        "projectId", 
        "gondolaId",
        "fileUrl" 
      FROM "Document"
      WHERE "projectId" = $1
      ORDER BY uploaded DESC;
    `;
    const result = await pool.query(query, [projectId]);

    // Type for documents fetched from the database
    type DocumentRow = {
      id: string;
      name: string;     // Actual filename for download
      type: string;     // Actual MIME type for download
      title?: string | null;    // User-provided title for display
      category?: string | null; // User-provided category for display
      uploaded: Date;
      expiry?: Date | null;
      status?: string | null;
      projectId: string;
      gondolaId?: string | null;
      fileUrl?: string | null;
    };

    const documents: DocumentRow[] = result.rows;
    return NextResponse.json(documents);
  } catch (error) {
    console.error(`Error fetching documents for project ${projectId}:`, error);
    // It's good practice to avoid sending detailed error messages to the client in production
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}
