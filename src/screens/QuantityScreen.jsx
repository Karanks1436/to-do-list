// import React,{useMemo}from'react';
// import{Alert,ScrollView,Text,TextInput,TouchableOpacity,View}from'react-native';
// import{Btn,Card,Header,Pill}from'../components/UI';
// import{C}from'../theme';import{s}from'../styles';

// export const AVERAGE_RATES={plastic_pet:12,plastic_hdpe:20,plastic_ldpe:10,mixed_plastic:8,cardboard:10,paper:14,newspaper:16,glass:4,metal_aluminium:110,metal_steel:32,metal_iron:28,metal_copper:650,metal_brass:400,ewaste:50,organic:2,textile:8};
// const CATEGORY_RATES={plastic:10,paper:12,cardboard:10,glass:4,metal:30,ewaste:50,electronic:50,organic:2,textile:8,other:5};
// const PIECE_WEIGHT_KG={plastic_pet:.025,plastic_hdpe:.05,plastic_ldpe:.01,mixed_plastic:.03,cardboard:.25,paper:.01,newspaper:.15,glass:.3,metal_aluminium:.015,metal_steel:.1,metal_iron:.15,ewaste:.5,textile:.25};
// const UNITS=[{id:'kg',label:'Kilograms',short:'kg'},{id:'g',label:'Grams',short:'g'},{id:'pieces',label:'Pieces',short:'pcs'}];
// export function getFallbackRate(material){const id=material?.id||material?.materialId||'',category=String(material?.category||'other').toLowerCase();return AVERAGE_RATES[id]??CATEGORY_RATES[category]??CATEGORY_RATES.other}
// export function getPieceWeightKg(material){return Number(material?.averageWeightKgPerPiece||PIECE_WEIGHT_KG[material?.id||material?.materialId]||.1)}
// export function convertQuantityToKg(quantity,unit,material){const value=Number(quantity);if(!Number.isFinite(value)||value<=0)return 0;if(unit==='g')return value/1000;if(unit==='pieces')return value*getPieceWeightKg(material);return value}

// export default function QuantityScreen({go,quantity,setQuantity,unit='kg',setUnit=()=>{},rate,rateMonth,rateSource,material}){
//  const adminRate=Number(rate||0),fallbackRate=useMemo(()=>getFallbackRate(material),[material?.id,material?.materialId,material?.category]),effectiveRate=adminRate>0?adminRate:fallbackRate,usingAdminRate=adminRate>0,kgEquivalent=convertQuantityToKg(quantity,unit,material),valid=kgEquivalent>0,total=kgEquivalent*effectiveRate,pieceWeight=getPieceWeightKg(material),unitInfo=UNITS.find(x=>x.id===unit)||UNITS[0];
//  const changeQuantity=value=>{const cleaned=value.replace(/[^0-9.]/g,'');if(cleaned.split('.').length<=2)setQuantity(cleaned)};
//  const next=()=>{if(!valid)return Alert.alert('Invalid quantity','Enter a quantity greater than zero.');go('collectors')};
//  return <ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}><Header title="Quantity & Price" back={()=>go('result')}/><Card><View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:16}}><View style={{flex:1}}><Text style={[s.whiteTitle,{fontSize:17}]}>{material?.name||'Recyclable Material'}</Text><Text style={[s.small,{marginTop:4,textTransform:'capitalize'}]}>Category: {material?.category||'recyclable'} · {formatMaterial(material?.id||material?.materialId)}</Text></View><Pill solid={usingAdminRate} text={usingAdminRate?'ADMIN RATE':'AVERAGE RATE'}/></View><Text style={labelStyle}>Select quantity type</Text><View style={{flexDirection:'row',gap:8,marginBottom:17}}>{UNITS.map(x=>{const selected=unit===x.id;return <TouchableOpacity key={x.id} onPress={()=>{setUnit(x.id);setQuantity('')}} style={{flex:1,minHeight:54,borderRadius:10,borderWidth:1,borderColor:selected?C.green:'#d6e3df',backgroundColor:selected?'#e4fbea':'#fff',alignItems:'center',justifyContent:'center'}}><Text style={{color:selected?'#167340':'#42695d',fontWeight:'800',fontSize:13}}>{x.short}</Text><Text style={{color:selected?'#37825a':'#81958f',fontSize:9,marginTop:2}}>{x.label}</Text></TouchableOpacity>})}</View><Text style={labelStyle}>Quantity in {unitInfo.label.toLowerCase()}</Text><View style={{flexDirection:'row',alignItems:'center',marginBottom:12}}><TextInput style={[s.input,{flex:1,color:'#173a31',borderColor:'#ccd9d5',backgroundColor:'#fff',marginBottom:0,fontSize:17,fontWeight:'700'}]} keyboardType="decimal-pad" value={quantity} onChangeText={changeQuantity} placeholder="0" placeholderTextColor="#8ba09a"/><View style={{height:52,minWidth:70,borderRadius:10,backgroundColor:'#e8f5ed',alignItems:'center',justifyContent:'center',marginLeft:9,paddingHorizontal:12}}><Text style={{color:'#265942',fontWeight:'800'}}>{unitInfo.short}</Text></View></View>{unit!=='kg'&&valid&&<View style={{backgroundColor:'#eef8f1',borderRadius:9,padding:10,marginBottom:14}}><Text style={{color:'#42695d',fontSize:11}}>Estimated weight equivalent: <Text style={{fontWeight:'800'}}>{kgEquivalent.toFixed(3)} kg</Text></Text>{unit==='pieces'&&<Text style={{color:'#718b82',fontSize:10,marginTop:3}}>Using approximately {(pieceWeight*1000).toFixed(0)} g per piece. Collector will verify actual weight.</Text>}</View>}<View style={{backgroundColor:usingAdminRate?'#e7fff0':'#fff8df',borderRadius:12,padding:15,marginBottom:15}}><Text style={{color:usingAdminRate?'#347052':'#80691e',fontSize:10,fontWeight:'800'}}>{usingAdminRate?'CURRENT CATEGORY RATE':'TEMPORARY AVERAGE RATE'}</Text><Text style={{color:'#173a31',fontSize:13,fontWeight:'700',marginTop:5}}>{material?.name||formatMaterial(material?.id||material?.materialId)}</Text><Text style={{color:'#173a31',fontSize:21,fontWeight:'800',marginTop:4}}>₹{effectiveRate.toFixed(2)} / kg</Text>{usingAdminRate&&rateMonth&&<Text style={{color:'#55756a',fontSize:10,marginTop:4}}>Published for {formatRateMonth(rateMonth)}</Text>}</View>{!usingAdminRate&&<Text style={{color:'#745e17',fontSize:10,lineHeight:16,backgroundColor:'#fff5ce',padding:10,borderRadius:9,marginBottom:15}}>No monthly admin rate is available, so this uses a temporary category average. The collector verifies the final weight and amount.</Text>}<View style={{borderTopWidth:1,borderTopColor:'#dce8e4',paddingTop:15,marginBottom:18}}><Text style={labelStyle}>Estimated value</Text><Text style={{color:'#173a31',fontSize:31,fontWeight:'900'}}>₹{total.toFixed(0)}</Text>{valid&&<Text style={[s.small,{marginTop:4}]}>{kgEquivalent.toFixed(3)} kg × ₹{effectiveRate.toFixed(2)} per kg</Text>}</View><Btn disabled={!valid} title="Find Nearby Collectors" onPress={next}/></Card><Text style={{color:C.muted,fontSize:10,lineHeight:16,textAlign:'center',paddingHorizontal:15}}>Final payment depends on actual weight, material quality, cleanliness and collector verification.</Text></ScrollView>
// }
// const labelStyle={color:'#42695d',fontSize:12,fontWeight:'700',marginBottom:7};
// function formatMaterial(id){const labels={plastic_pet:'PET plastic',plastic_hdpe:'HDPE plastic',plastic_ldpe:'LDPE plastic',mixed_plastic:'Mixed plastic',cardboard:'Cardboard',paper:'Mixed paper',newspaper:'Newspaper',glass:'Glass',metal_aluminium:'Aluminium',metal_steel:'Steel',metal_iron:'Iron',metal_copper:'Copper',metal_brass:'Brass',ewaste:'Electronic waste',organic:'Organic waste',textile:'Textile'};return labels[id]||String(id||'material').replace(/_/g,' ').replace(/\b\w/g,x=>x.toUpperCase())}
// function formatRateMonth(value){if(!/^\d{4}-\d{2}$/.test(String(value||'')))return value||'';const[year,month]=String(value).split('-').map(Number);return new Date(year,month-1,1).toLocaleDateString('en-IN',{month:'long',year:'numeric'})}


import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { doc, onSnapshot } from "firebase/firestore";

import { Btn, Card, Header, Pill } from "../components/UI";
import { db } from "../firebase/firebase";
import { C } from "../theme";
import { s } from "../styles";

export const AVERAGE_RATES = {
  plastic_pet: 12,
  plastic_hdpe: 20,
  plastic_ldpe: 10,
  mixed_plastic: 8,
  cardboard: 10,
  paper: 14,
  newspaper: 16,
  glass: 4,
  metal_aluminium: 110,
  metal_steel: 32,
  metal_iron: 28,
  metal_copper: 650,
  metal_brass: 400,
  ewaste: 50,
  organic: 2,
  textile: 8,
};

const CATEGORY_RATES = {
  plastic: 10,
  paper: 12,
  cardboard: 10,
  glass: 4,
  metal: 30,
  ewaste: 50,
  electronic: 50,
  organic: 2,
  textile: 8,
  other: 5,
};

const PIECE_WEIGHT_KG = {
  plastic_pet: 0.025,
  plastic_hdpe: 0.05,
  plastic_ldpe: 0.01,
  mixed_plastic: 0.03,
  cardboard: 0.25,
  paper: 0.01,
  newspaper: 0.15,
  glass: 0.3,
  metal_aluminium: 0.015,
  metal_steel: 0.1,
  metal_iron: 0.15,
  metal_copper: 0.1,
  metal_brass: 0.1,
  ewaste: 0.5,
  organic: 0.1,
  textile: 0.25,
};

const UNITS = [
  { id: "kg", label: "Kilograms", short: "kg" },
  { id: "g", label: "Grams", short: "g" },
  { id: "pieces", label: "Pieces", short: "pcs" },
];

export function getFallbackRate(material) {
  const id = material?.id || material?.materialId || "";
  const category = String(material?.category || "other").toLowerCase();
  return AVERAGE_RATES[id] ?? CATEGORY_RATES[category] ?? CATEGORY_RATES.other;
}

export function getPieceWeightKg(material) {
  const id = material?.id || material?.materialId;
  return Number(material?.averageWeightKgPerPiece || PIECE_WEIGHT_KG[id] || 0.1);
}

export function convertQuantityToKg(quantity, unit, material) {
  const value = Number(quantity);
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (unit === "g") return value / 1000;
  if (unit === "pieces") return value * getPieceWeightKg(material);
  return value;
}

export default function QuantityScreen({
  go,
  quantity,
  setQuantity,
  unit = "kg",
  setUnit = () => {},
  // These props are retained only as an instant cached value while the direct
  // Firestore listener is connecting. Firestore remains the source of truth.
  rate = 0,
  rateMonth = null,
  material,
}) {
  const materialId = material?.id || material?.materialId || "";
  const [firebaseRate, setFirebaseRate] = useState(undefined);
  const [rateLoading, setRateLoading] = useState(false);
  const [rateError, setRateError] = useState(null);

  useEffect(() => {
    if (!materialId) {
      setFirebaseRate(null);
      setRateLoading(false);
      setRateError(null);
      return undefined;
    }

    setFirebaseRate(undefined);
    setRateLoading(true);
    setRateError(null);

    // AdminScreen writes the latest value to currentRates/{materialId}.
    // onSnapshot makes this screen update immediately whenever admin changes it.
    const unsubscribe = onSnapshot(
      doc(db, "currentRates", materialId),
      (snapshot) => {
        setFirebaseRate(
          snapshot.exists()
            ? { id: snapshot.id, ...snapshot.data() }
            : null
        );
        setRateLoading(false);
        setRateError(null);
      },
      (error) => {
        console.warn("Current material rate fetch failed:", error?.message);
        setFirebaseRate(null);
        setRateLoading(false);
        setRateError(error?.message || "Unable to fetch the current Firebase price.");
      }
    );

    return unsubscribe;
  }, [materialId]);

  const fallbackRate = useMemo(
    () => getFallbackRate(material),
    [material?.id, material?.materialId, material?.category]
  );

  // Use the shell's already-fetched rate only during the first listener load.
  // After the first snapshot, the direct currentRates document is authoritative.
  const cachedRate = Number(rate || 0);
  const firestoreRate = Number(firebaseRate?.ratePerKg || 0);
  const adminRate =
    firebaseRate === undefined && cachedRate > 0 ? cachedRate : firestoreRate;
  const effectiveRate = adminRate > 0 ? adminRate : fallbackRate;
  const usingAdminRate = adminRate > 0;
  const publishedMonth = firebaseRate?.month || rateMonth || null;

  const kgEquivalent = convertQuantityToKg(quantity, unit, material);
  const valid = kgEquivalent > 0;
  const total = kgEquivalent * effectiveRate;
  const pieceWeight = getPieceWeightKg(material);
  const unitInfo = UNITS.find((item) => item.id === unit) || UNITS[0];

  const changeQuantity = (value) => {
    const cleaned = value.replace(/[^0-9.]/g, "");
    if (cleaned.split(".").length <= 2) setQuantity(cleaned);
  };

  const changeUnit = (nextUnit) => {
    setUnit(nextUnit);
    setQuantity("");
  };

  const next = () => {
    if (!valid) {
      return Alert.alert("Invalid quantity", "Enter a quantity greater than zero.");
    }
    go("collectors");
  };

  return (
    <ScrollView
      contentContainerStyle={s.page}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Header title="Quantity & Price" back={() => go("result")} />

      <Card>
        <View style={styles.materialHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[s.whiteTitle, { fontSize: 17 }]}>
              {material?.name || "Recyclable Material"}
            </Text>
            <Text style={[s.small, styles.category]}>
              Category: {material?.category || "recyclable"} · {formatMaterial(materialId)}
            </Text>
          </View>
          <Pill
            solid={usingAdminRate}
            text={usingAdminRate ? "FIREBASE RATE" : "AVERAGE RATE"}
          />
        </View>

        <Text style={styles.label}>Select quantity type</Text>
        <View style={styles.unitsRow}>
          {UNITS.map((item) => {
            const selected = unit === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => changeUnit(item.id)}
                style={[
                  styles.unitButton,
                  selected && styles.unitButtonSelected,
                ]}
              >
                <Text
                  style={[
                    styles.unitShort,
                    selected && { color: "#167340" },
                  ]}
                >
                  {item.short}
                </Text>
                <Text
                  style={[
                    styles.unitLabel,
                    selected && { color: "#37825a" },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>
          Quantity in {unitInfo.label.toLowerCase()}
        </Text>
        <View style={styles.quantityRow}>
          <TextInput
            style={[s.input, styles.quantityInput]}
            keyboardType="decimal-pad"
            value={quantity}
            onChangeText={changeQuantity}
            placeholder="0"
            placeholderTextColor="#8ba09a"
          />
          <View style={styles.unitSuffix}>
            <Text style={{ color: "#265942", fontWeight: "800" }}>
              {unitInfo.short}
            </Text>
          </View>
        </View>

        {unit !== "kg" && valid && (
          <View style={styles.equivalentBox}>
            <Text style={styles.equivalentText}>
              Estimated weight equivalent:{" "}
              <Text style={{ fontWeight: "800" }}>{kgEquivalent.toFixed(3)} kg</Text>
            </Text>
            {unit === "pieces" && (
              <Text style={styles.pieceText}>
                Using approximately {(pieceWeight * 1000).toFixed(0)} g per piece.
                Collector will verify actual weight.
              </Text>
            )}
          </View>
        )}

        <View
          style={[
            styles.rateBox,
            { backgroundColor: usingAdminRate ? "#e7fff0" : "#fff8df" },
          ]}
        >
          <View style={styles.rateStatusRow}>
            <Text
              style={[
                styles.rateCaption,
                { color: usingAdminRate ? "#347052" : "#80691e" },
              ]}
            >
              {usingAdminRate
                ? "CURRENT FIREBASE ADMIN RATE"
                : "TEMPORARY AVERAGE RATE"}
            </Text>
            {rateLoading && <ActivityIndicator size="small" color={C.green} />}
          </View>
          <Text style={styles.rateMaterial}>
            {material?.name || formatMaterial(materialId)}
          </Text>
          <Text style={styles.rateValue}>₹{effectiveRate.toFixed(2)} / kg</Text>
          {usingAdminRate && publishedMonth && (
            <Text style={styles.rateMonth}>
              Published for {formatRateMonth(publishedMonth)}
            </Text>
          )}
          {usingAdminRate && firebaseRate?.updatedAt && (
            <Text style={styles.liveText}>Live from Firestore currentRates</Text>
          )}
        </View>

        {!!rateError && (
          <Text style={styles.errorText}>
            Firebase price unavailable: {rateError} Using the average fallback price.
          </Text>
        )}

        {!rateLoading && !usingAdminRate && !rateError && (
          <Text style={styles.fallbackText}>
            No admin price exists at currentRates/{materialId || "materialId"}, so
            this uses a temporary material/category average. The collector verifies
            the final weight and amount.
          </Text>
        )}

        <View style={styles.totalBox}>
          <Text style={styles.label}>Estimated value</Text>
          <Text style={styles.total}>₹{total.toFixed(0)}</Text>
          {valid && (
            <Text style={[s.small, { marginTop: 4 }]}>
              {kgEquivalent.toFixed(3)} kg × ₹{effectiveRate.toFixed(2)} per kg
            </Text>
          )}
        </View>

        <Btn
          disabled={!valid || rateLoading}
          title={rateLoading ? "Fetching Current Price…" : "Find Nearby Collectors"}
          onPress={next}
        />
      </Card>

      <Text style={styles.disclaimer}>
        Final payment depends on actual weight, material quality, cleanliness and
        collector verification.
      </Text>
    </ScrollView>
  );
}

const styles = {
  materialHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  category: { marginTop: 4, textTransform: "capitalize" },
  label: { color: "#42695d", fontSize: 12, fontWeight: "700", marginBottom: 7 },
  unitsRow: { flexDirection: "row", marginHorizontal: -4, marginBottom: 17 },
  unitButton: {
    flex: 1,
    minHeight: 54,
    marginHorizontal: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d6e3df",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  unitButtonSelected: { borderColor: C.green, backgroundColor: "#e4fbea" },
  unitShort: { color: "#42695d", fontWeight: "800", fontSize: 13 },
  unitLabel: { color: "#81958f", fontSize: 9, marginTop: 2 },
  quantityRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  quantityInput: {
    flex: 1,
    color: "#173a31",
    borderColor: "#ccd9d5",
    backgroundColor: "#fff",
    marginBottom: 0,
    fontSize: 17,
    fontWeight: "700",
  },
  unitSuffix: {
    height: 52,
    minWidth: 70,
    borderRadius: 10,
    backgroundColor: "#e8f5ed",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 9,
    paddingHorizontal: 12,
  },
  equivalentBox: {
    backgroundColor: "#eef8f1",
    borderRadius: 9,
    padding: 10,
    marginBottom: 14,
  },
  equivalentText: { color: "#42695d", fontSize: 11 },
  pieceText: { color: "#718b82", fontSize: 10, marginTop: 3 },
  rateBox: { borderRadius: 12, padding: 15, marginBottom: 15 },
  rateStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rateCaption: { fontSize: 10, fontWeight: "800" },
  rateMaterial: { color: "#173a31", fontSize: 13, fontWeight: "700", marginTop: 5 },
  rateValue: { color: "#173a31", fontSize: 21, fontWeight: "800", marginTop: 4 },
  rateMonth: { color: "#55756a", fontSize: 10, marginTop: 4 },
  liveText: { color: "#16874a", fontSize: 9, fontWeight: "700", marginTop: 4 },
  fallbackText: {
    color: "#745e17",
    fontSize: 10,
    lineHeight: 16,
    backgroundColor: "#fff5ce",
    padding: 10,
    borderRadius: 9,
    marginBottom: 15,
  },
  errorText: {
    color: "#9b3540",
    fontSize: 10,
    lineHeight: 16,
    backgroundColor: "#ffe9eb",
    padding: 10,
    borderRadius: 9,
    marginBottom: 15,
  },
  totalBox: {
    borderTopWidth: 1,
    borderTopColor: "#dce8e4",
    paddingTop: 15,
    marginBottom: 18,
  },
  total: { color: "#173a31", fontSize: 31, fontWeight: "900" },
  disclaimer: {
    color: C.muted,
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
    paddingHorizontal: 15,
  },
};

function formatMaterial(id) {
  const labels = {
    plastic_pet: "PET plastic",
    plastic_hdpe: "HDPE plastic",
    plastic_ldpe: "LDPE plastic",
    mixed_plastic: "Mixed plastic",
    cardboard: "Cardboard",
    paper: "Mixed paper",
    newspaper: "Newspaper",
    glass: "Glass",
    metal_aluminium: "Aluminium",
    metal_steel: "Steel",
    metal_iron: "Iron",
    metal_copper: "Copper",
    metal_brass: "Brass",
    ewaste: "Electronic waste",
    organic: "Organic waste",
    textile: "Textile",
  };
  return (
    labels[id] ||
    String(id || "material")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

function formatRateMonth(value) {
  if (!/^\d{4}-\d{2}$/.test(String(value || ""))) return value || "";
  const [year, month] = String(value).split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}
