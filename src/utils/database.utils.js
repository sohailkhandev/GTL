import { db } from "../config/Firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
  query,
  where,
  getDocs,
  orderBy,
  setDoc,
} from "firebase/firestore";

export const fetchSubcollectionDocuments = async ({
  parentDocumentPath,
  subcollectionName,
  sortBy = "",
  sortOrder = "asc",
}) => {
  try {
    const subcollectionRef = collection(
      db,
      `${parentDocumentPath}/${subcollectionName}`
    );

    let q;
    if (sortBy) {
      q = query(subcollectionRef, orderBy(sortBy, sortOrder));
    } else {
      q = query(subcollectionRef);
    }

    const querySnapshot = await getDocs(q);

    const documents = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    if (documents.length > 0) {
      console.log(
        `Database Service: Successfully retrieved ${documents.length} documents from Subcollection [${subcollectionName}] under Parent [${parentDocumentPath}]`
      );
    } else {
      console.log(
        `Database Service: No documents found in Subcollection [${subcollectionName}] under Parent [${parentDocumentPath}]`
      );
    }

    return {
      documents,
      count: querySnapshot.size,
    };
  } catch (error) {
    console.error(
      `Database Service [fetchSubcollectionDocuments] Error: ${error}`
    );
    throw error;
  }
};

export const addDocument = async ({ collectionName, data }) => {
  try {
    const docRef = await addDoc(collection(db, collectionName), data);

    console.log(
      `Database Service: Document written with ID: [${docRef.id}] to Collection: [${collectionName}]`
    );
    return docRef.id;
  } catch (error) {
    console.error(`Database Service [addDocument] Error: ${error}`);
    throw error;
  }
};

export const addDocumentWithId = async ({ collectionName, data, customId }) => {
  try {
    const docRef = doc(collection(db, collectionName), customId);
    await setDoc(docRef, data);

    console.log(
      `Database Service: Document written with custom ID: [${customId}] to Collection: [${collectionName}]`
    );
    return customId;
  } catch (error) {
    console.error(`Database Service [addDocumentWithId] Error: ${error}`);
    throw error;
  }
};

export const deleteDocument = async ({ collectionName, documentId }) => {
  try {
    await deleteDoc(doc(db, collectionName, documentId));

    console.log(
      `Database Service: Document with ID: [${documentId}] successfully deleted from Collection [${collectionName}]`
    );
  } catch (error) {
    console.error(`Database Service [deleteDocument] Error: ${error}`);
    throw error;
  }
};

export const updateDocument = async ({ collectionName, documentId, data }) => {
  try {
    const documentRef = doc(db, collectionName, documentId);
    await updateDoc(documentRef, data);
    console.log(
      `Database Service: Document with ID: [${documentId}] successfully updated in Collection [${collectionName}]`
    );
  } catch (error) {
    console.error(`Database Service [updateDocument] Error ${error}`);
    throw error;
  }
};

export const getDocumentById = async ({ collectionName, documentId }) => {
  try {
    const documentRef = doc(db, collectionName, documentId);
    const documentSnapshot = await getDoc(documentRef);

    if (documentSnapshot.exists()) {
      console.log(
        `Database Service: Document with ID: [${documentId}] successfully retrieved from Collection [${collectionName}]`
      );
      return { id: documentSnapshot.id, ...documentSnapshot.data() };
    } else {
      console.log(
        `Database Service: No document found with ID: [${documentId}] in Collection [${collectionName}]`
      );
      return null;
    }
  } catch (error) {
    console.error(`Database Service [getDocumentById] Error ${error}`);
    throw error;
  }
};

export const getDocumentsByFilters = async ({ collectionName, filters }) => {
  try {
    const collectionRef = collection(db, collectionName);
    const queryConstraints = filters.map((filter) =>
      where(filter.field, filter.operator, filter.value)
    );
    const q = query(collectionRef, ...queryConstraints);

    const querySnapshot = await getDocs(q);
    const documents = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    if (documents.length > 0) {
      console.log(
        `Database Service: Successfully retrieved ${documents.length} documents from Collection [${collectionName}]`
      );
    } else {
      console.log(
        `Database Service: No documents found in Collection [${collectionName}] with specified filters`
      );
    }

    return { documents, count: querySnapshot.size };
  } catch (error) {
    console.error(`Database Service [getDocumentsByFilters] Error ${error}`);
    throw error;
  }
};

export const getAllDocuments = async ({
  collectionName,
  sortBy = "",
  sortOrder = "asc",
}) => {
  try {
    let q;
    if (sortBy) {
      q = query(collection(db, collectionName), orderBy(sortBy, sortOrder));
    } else {
      q = query(collection(db, collectionName));
    }

    const querySnapshot = await getDocs(q);
    const documents = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    if (documents.length > 0) {
      console.log(
        `Database Service: Successfully retrieved ${documents.length} documents from Collection [${collectionName}]`
      );
    } else {
      console.log(
        `Database Service: No documents found in Collection [${collectionName}]`
      );
    }

    return {
      documents,
      count: querySnapshot.size,
    };
  } catch (error) {
    console.error(
      `Database Service: Error fetching documents from Collection [${collectionName}]`,
      error
    );
    throw error;
  }
};

export const createRefFromString = ({ collectionName, idString }) => {
  const docRef = doc(db, collectionName, idString);
  return docRef;
};

export default {
  addDocument,
  deleteDocument,
  updateDocument,
  getDocumentById,
  getDocumentsByFilters,
  getAllDocuments,
  addDocumentWithId,
  createRefFromString,
  fetchSubcollectionDocuments,
};
