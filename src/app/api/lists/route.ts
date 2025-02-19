import { getListByName, createList } from '@/utils/mongoDB/listCRUD';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Get listName from URL parameters
    const { searchParams } = new URL(request.url);
    const listName = searchParams.get('name');

    if (!listName) {
      return NextResponse.json(
        { error: 'List name is required' },
        { status: 400 }
      );
    }

    console.log('API: Fetching list:', listName);
    const list = await getListByName(listName);
    console.log('API: Found list:', list);

    if (!list) {
      return NextResponse.json(
        { error: 'List not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ list: list.list });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch list' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name, list } = await request.json();
    
    if (!name) {
      return NextResponse.json(
        { error: 'List name is required' },
        { status: 400 }
      );
    }

    const result = await createList(name, list || []);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create list' },
      { status: 500 }
    );
  }
}