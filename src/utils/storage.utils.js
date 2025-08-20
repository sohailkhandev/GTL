import { storage } from "../config/Firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export const uploadFile = async ({ fileName, folderName, file }) => {
  try {
    // Upload the selected file to Firebase Storage
    const location = `${folderName}/${fileName}`;
    const storageRef = ref(storage, location);
    const snapshot = await uploadBytes(storageRef, file);

    // Get the download URL of the uploaded file
    const downloadURL = await getDownloadURL(snapshot.ref);

    console.log(
      `Storage Service: File Uploaded to [${location}] with URL [${downloadURL}]`
    );
    return downloadURL;
  } catch (error) {
    console.error(`Storage Service [uploadFile] Error: ${error}`);
    throw error;
  }
};

const storageUtils = {
  uploadFile,
};

export default storageUtils;
