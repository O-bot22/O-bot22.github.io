async function upload(db, data, document_name, collection_name) {
  for (const item of data) {
    const docRef = db.collection(collection_name).doc(document_name);

    try {
      await docRef.set(item);
      console.log(`✅ Document ${document_name} created successfully!`);
    } catch (error) {
      console.error("❌ Error seeding document:", error);
    }
  }
}

export { upload };