import clientPromise from './mongoConnect';
import { APP_DB } from './dbName';
import { ObjectId } from 'mongodb';

export async function getLists() {
  const client = await clientPromise;
  const db = client.db(APP_DB);
  const collection = db.collection('Lists');
  const lists = await collection.find({}).toArray();
  return lists;
}

// Renames a list. Names are the primary key here (no separate _id lookups
// elsewhere reference a list by name), so this is a straightforward field
// update, guarded against colliding with an existing list.
export async function renameList(oldName, newName) {
  const client = await clientPromise;
  const db = client.db(APP_DB);
  const collection = db.collection('Lists');

  if (newName !== oldName) {
    const existing = await collection.findOne({ name: newName });
    if (existing) throw new Error('A list with that name already exists');
  }

  const result = await collection.updateOne({ name: oldName }, { $set: { name: newName } });
  if (result.matchedCount === 0) {
    throw new Error('List not found');
  }
  return result;
}

// kind: "progress" shows a completion bar in OpsBoard; anything falsy clears
// it back to the default rolling-checklist display.
export async function updateListKind(listName, kind) {
  const client = await clientPromise;
  const db = client.db(APP_DB);
  const collection = db.collection('Lists');

  const update = kind ? { $set: { kind } } : { $unset: { kind: '' } };
  const result = await collection.updateOne({ name: listName }, update);
  if (result.matchedCount === 0) {
    throw new Error('List not found');
  }
  return result;
}

// Persists a full drag-to-reorder pass: orderedNames[i] gets sortOrder = i.
// One bulkWrite rather than N separate round-trips.
export async function reorderLists(orderedNames) {
  const client = await clientPromise;
  const db = client.db(APP_DB);
  const collection = db.collection('Lists');

  if (!Array.isArray(orderedNames) || orderedNames.length === 0) {
    return { success: true, modifiedCount: 0 };
  }
  const ops = orderedNames.map((name, i) => ({
    updateOne: { filter: { name }, update: { $set: { sortOrder: i } } },
  }));
  const result = await collection.bulkWrite(ops);
  return result;
}

export async function updateListParent(listName, parentName) {
  const client = await clientPromise;
  const db = client.db(APP_DB);
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
  const db = client.db(APP_DB);
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
  const db = client.db(APP_DB);
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
  const db = client.db(APP_DB);
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
  const db = client.db(APP_DB);
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
  const db = client.db(APP_DB);
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
  const db = client.db(APP_DB);
  const collection = db.collection('Lists');

  const result = await collection.deleteOne({ name: listName });

  if (result.deletedCount === 0) {
    throw new Error('No documents matched the query. Deletion may have failed.');
  }

  return result;
};

export async function updateListItem(listName, itemName, updates) {
  const client = await clientPromise;
  const db = client.db(APP_DB);
  const collection = db.collection('Lists');
  
  // Set individual fields on the matched element — never replace the whole
  // element (that would drop `name` and any other fields). The query below
  // matches on the OLD itemName, so including a new `name` here safely
  // renames that element via the positional $ operator.
  const setDoc = {};
  for (const [k, v] of Object.entries(updates || {})) {
    setDoc[`list.$.${k}`] = v;
  }
  if (Object.keys(setDoc).length === 0) return { matchedCount: 1, modifiedCount: 0 };

  const result = await collection.updateOne(
    { name: listName, 'list.name': itemName },
    { $set: setDoc }
  );

  if (result.matchedCount === 0) {
    throw new Error('List or item not found');
  }

  return result;
}

export async function deleteListItem(listName, itemName) {
  const client = await clientPromise;
  const db = client.db(APP_DB);
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
  const db = client.db(APP_DB);
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
  const db = client.db(APP_DB);
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