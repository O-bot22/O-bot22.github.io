// A simple script to add data to your LOCAL emulator
const admin = require("firebase-admin");

// Tell the script to talk to the EMULATOR, not production
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8888";

admin.initializeApp({ projectId: "puerto-real-energy-poverty" });
const db = admin.firestore();

const zoneData = {
  // String Fields
  district_code: "01",
  municipality: "Puerto Real",
  section_code: "001",
  source_dataset: "tabla-30944.xlsx",
  source_label: "1102801001 Puerto Real sección 01001",

  // Numeric Fields (Income/Renta)
  mediana_renta_unidad_consumo: 17850,
  renta_bruta_media_hogar: 38270,
  renta_bruta_media_persona: 15564,
  renta_media_unidad_consumo: 19045,
  renta_neta_media_hogar: 32509,
  renta_neta_media_persona: 13221,

  // Map Fields (Nested Data)
  tabla_30946: {
    "poblacion_con_ingresos_por_unidad_de_consumo_por_debajo_de_10_000_euros_hombres": 17.4,
    "poblacion_con_ingresos_por_unidad_de_consumo_por_debajo_de_10_000_euros_mujeres": 18.6,
    "poblacion_con_ingresos_por_unidad_de_consumo_por_debajo_de_10_000_euros_total": 18,
    
    "poblacion_con_ingresos_por_unidad_de_consumo_por_debajo_de_5_000_euros_hombres": 4,
    "poblacion_con_ingresos_por_unidad_de_consumo_por_debajo_de_5_000_euros_mujeres": 4.1,
    "poblacion_con_ingresos_por_unidad_de_consumo_por_debajo_de_5_000_euros_total": 4.1,
    
    "poblacion_con_ingresos_por_unidad_de_consumo_por_debajo_de_7_500_euros_hombres": 9.5,
    "poblacion_con_ingresos_por_unidad_de_consumo_por_debajo_de_7_500_euros_mujeres": 9.7,
    "poblacion_con_ingresos_por_unidad_de_consumo_por_debajo_de_7_500_euros_total": 9.6,
    
  },
  tabla_30949: {
    poblacion_con_ingresos_por: "..."
  }
};

async function seed() {
  // Define your specific ID here (from your screenshot)
  const docId = "1102801001"; 
  const docRef = db.collection("Zones").doc(docId);
  // await db.collection("Zones").add(zoneData);


  try {
    // 4. Use .set() to create or overwrite the document with your ID
    await docRef.set(zoneData);
    console.log(`✅ Document ${docId} created successfully!`);
  } catch (error) {
    console.error("❌ Error seeding document:", error);
  }
}

seed();