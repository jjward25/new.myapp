import clientPromise from './mongoConnect';
import { ObjectId } from 'mongodb';

export async function getLists() {
  const client = await clientPromise;
  const db = client.db('Personal');
  const collection = db.collection('Lists');
  const lists = await collection.find({}).toArray();
  return lists;
}

export async function updateListParent(listName, parentName) {
  const client = await clientPromise;
  const db = client.db('Personal');
  const collection = db.collection('Lists');

  const result = await collection.updateOne(
    { name: listName },
    { $set: { parent: parentName } }
  );

  if (result.matchedCount === 0) {
    throw new Error('List not found');
  }

  return result;
}

export async function getListByName(listName) {
  const client = await clientPromise;
  const db = client.db('Personal');
  const collection = db.collection('Lists');

  try {
    const list = await collection.findOne({ name: listName });
    if (!list) {
      throw new Error('List not found');
    }
    return list;
  } catch (error) {
    console.error('Error retrieving list:', error);
    throw error;
  }
}

export async function addList(listName) {
  const client = await clientPromise;
  const db = client.db('Personal');
  const collection = db.collection('Lists');

  if (!listName) {
    throw new Error('Missing list name');
  }

  const result = await collection.insertOne({
    name: listName,
    list: []
  });

  return result;
}

export async function addItem(listName, item) {
  const client = await clientPromise;
  const db = client.db('Personal');
  const collection = db.collection('Lists');
  
  const result = await collection.updateOne(
    { name: listName },
    { $push: { list: item } }
  );
  
  if (result.matchedCount === 0) {
    throw new Error('List not found');
  }
  
  return result;
}

export const updateItem = async (listName, itemIndex, updates) => {
  const client = await clientPromise;
  const db = client.db('Personal');
  const collection = db.collection('Lists');

  try {
    const result = await collection.updateOne(
      { name: listName },
      { $set: { [`list.${itemIndex}`]: updates } }
    );

    if (result.matchedCount === 0) {
      throw new Error('List not found');
    }

    return result;
  } catch (error) {
    console.error('Error updating item:', error);
    throw error;
  }
};

export const deleteItem = async (listName, itemIndex) => {
  const client = await clientPromise;
  const db = client.db('Personal');
  const collection = db.collection('Lists');

  const result = await collection.updateOne(
    { name: listName },
    { $unset: { [`list.${itemIndex}`]: 1 } }
  );

  if (result.modifiedCount === 0) {
    throw new Error('No documents matched the query. Deletion may have failed.');
  }

  // Remove the null element that $unset creates
  await collection.updateOne(
    { name: listName },
    { $pull: { list: null } }
  );

  return result;
};

export const deleteList = async (listName) => {
  const client = await clientPromise;
  const db = client.db('Personal');
  const collection = db.collection('Lists');

  const result = await collection.deleteOne({ name: listName });

  if (result.deletedCount === 0) {
    throw new Error('No documents matched the query. Deletion may have failed.');
  }

  return result;
};

export async function updateListItem(listName, itemName, updates) {
  const client = await clientPromise;
  const db = client.db('Personal');
  const collection = db.collection('Lists');
  
  const result = await collection.updateOne(
    { 
      name: listName,
      'list.name': itemName // Find the item by name
    },
    { 
      $set: { 'list.$': updates } // Update the matched item
    }
  );
  
  if (result.matchedCount === 0) {
    throw new Error('List or item not found');
  }
  
  return result;
}

export async function deleteListItem(listName, itemName) {
  const client = await clientPromise;
  const db = client.db('Personal');
  const collection = db.collection('Lists');
  
  const result = await collection.updateOne(
    { name: listName },
    { 
      $pull: { 
        list: { name: itemName } // Remove the item with matching name
      } 
    }
  );
  
  if (result.matchedCount === 0) {
    throw new Error('List not found');
  }
  
  return result;
}

export async function createList(name, list = [], parent = null) {
  const client = await clientPromise;
  const db = client.db('Personal');
  const collection = db.collection('Lists');
  
  // Check if list already exists
  const existingList = await collection.findOne({ name });
  if (existingList) {
    throw new Error('List already exists');
  }
  
  const result = await collection.insertOne({
    name,
    list,
    parent
  });
  
  return result;
}


export async function addItemsToList(listName, items) {
  const client = await clientPromise;
  const db = client.db('Personal');
  const collection = db.collection('Lists');

  try {
    // Find the list and update it by pushing all new items
    const result = await collection.updateOne(
      { name: listName },
      { $push: { list: { $each: items } } }
    );

    if (result.matchedCount === 0) {
      throw new Error('List not found');
    }

    return result;
  } catch (error) {
    console.error('Error adding items:', error);
    throw error;
  }
}