// app/api/backlog/route.js

import { ObjectId } from 'mongodb';
import { getBacklog, addRoutine , updateItem, deleteItem } from '../../../utils/mongoDB/routinesCRUD';


export async function PUT(req) {
  try {
    const { id, updatedItem } = await req.json();
    const objectId = new ObjectId(id);
    const result = await updateItem(objectId, updatedItem);
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    console.error('Error updating routine:', error);
    return new Response(JSON.stringify({ error: 'Unable to update routine' }), { status: 500 });
  }
}


export async function GET(req, res) {
  try {
    const backlog = await getBacklog();
    return new Response(JSON.stringify(backlog), { status: 200 });
  } catch (error) {
    console.error('Error fetching backlog:', error);
    return new Response(JSON.stringify({ error: 'Unable to fetch backlog' }), { status: 500 });
  }
}


export async function POST(req) {
  try {
    const newRoutine = await req.json();
    newRoutine._id = new ObjectId(); // Set a new ObjectId for the new routine
    const result = await addRoutine(newRoutine);

    return new Response(JSON.stringify(result), { status: 201 }); // Return the newly created routine
  } catch (error) {
    console.error('Error adding new routine:', error);
    return new Response(JSON.stringify({ error: 'Failed to add routine' }), { status: 500 });
  }
}


export async function DELETE(req, res) {
  try {
    const { id } = await req.json();
    const objectId = new ObjectId(id);
    const result = await deleteItem(objectId);
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    console.error('Error deleting item:', error);
    return new Response(JSON.stringify({ error: 'Unable to delete item' }), { status: 500 });
  }
}
