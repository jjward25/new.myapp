//src/app/api/calendar/route.js
import { ObjectId } from 'mongodb';
import { getCalendarEvents, addEvent, updateEvent, deleteEvent } from '../../../utils/mongoDB/calendarCRUD';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const backlog = await getCalendarEvents();
    return new Response(JSON.stringify(backlog), { status: 200 });
  } catch (error) {
    console.error('Error fetching backlog:', error);
    return new Response(JSON.stringify({ error: 'Unable to fetch backlog' }), { status: 500 });
  }
}

export async function POST(req) {
  try {
    const newItem = await req.json();
    newItem._id = new ObjectId();
    const result = await addEvent(newItem);
    return new Response(JSON.stringify(result), { status: 201 });
  } catch (error) {
    console.error('Error adding item:', error);
    return new Response(JSON.stringify({ error: 'Unable to add item' }), { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { id, updatedItem } = await req.json();
    if (!ObjectId.isValid(id)) {
      return new Response(JSON.stringify({ error: 'Invalid ID format' }), { status: 400 });
    }
    const objectId = new ObjectId(id);
    const result = await updateEvent(objectId, updatedItem);
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    console.error('Error updating item:', error);
    return new Response(JSON.stringify({ error: 'Unable to update item' }), { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { id } = await req.json();
    if (!ObjectId.isValid(id)) {
      return new Response(JSON.stringify({ error: 'Invalid ID format' }), { status: 400 });
    }
    const objectId = new ObjectId(id);
    const result = await deleteEvent(objectId);
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    console.error('Error deleting item:', error);
    return new Response(JSON.stringify({ error: 'Unable to delete item' }), { status: 500 });
  }
}
