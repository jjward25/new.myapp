import { addItem } from '@/utils/mongoDB/listCRUD';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received request body:', body); // Debug log

    const { listName, item } = body;
    
    if (!listName || !item || !item.name) {
      return NextResponse.json(
        { error: 'List name and item name are required' },
        { status: 400 }
      );
    }

    console.log('Adding item to list:', listName, item); // Debug log
    const result = await addItem(listName, item);
    
    return NextResponse.json({ 
      success: true, 
      result 
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add item' },
      { status: 500 }
    );
  }
} 