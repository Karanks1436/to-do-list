import { Ionicons } from "@expo/vector-icons";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Btn, Card, Header, Pill } from "../components/UI";
import { db } from "../firebase/firebase";
import { s } from "../styles";
import { C } from "../theme";

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
  { id: "kg", label: "Kilograms", short: "kg", icon: "scale-outline" },
  { id: "g", label: "Grams", short: "g", icon: "speedometer-outline" },
  { id: "pieces", label: "Pieces", short: "pcs", icon: "apps-outline" },
];

const PRESETS = {
  kg: [0.5, 1, 2, 5],
  g: [100, 250, 500, 1000],
  pieces: [1, 5, 10, 20],
};

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

    return onSnapshot(
      doc(db, "currentRates", materialId),
      (snapshot) => {
        setFirebaseRate(
          snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null
        );
        setRateLoading(false);
        setRateError(null);
      },
      (error) => {
        console.warn("Current material rate fetch failed:", error?.message);
        setFirebaseRate(null);
        setRateLoading(false);
        setRateError(
          error?.message || "Unable to fetch the current Firebase price."
        );
      }
    );
  }, [materialId]);

  const fallbackRate = useMemo(
    () => getFallbackRate(material),
    [material?.id, material?.materialId, material?.category]
  );

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
    if ((cleaned.match(/\./g) || []).length <= 1) setQuantity(cleaned);
  };

  const changeUnit = (nextUnit) => {
    setUnit(nextUnit);
    setQuantity("");
  };

  const next = () => {
    if (!valid) {
      return Alert.alert(
        "Enter a valid quantity",
        `Enter the amount in ${unitInfo.label.toLowerCase()} before finding collectors.`
      );
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

      <View style={styles.steps}>
        <Step icon="checkmark" label="Photo" complete />
        <View style={styles.stepLineActive} />
        <Step icon="checkmark" label="Material" complete />
        <View style={styles.stepLineActive} />
        <Step number="3" label="Quantity" active />
      </View>

      <View style={styles.materialBanner}>
        <View style={styles.materialIcon}>
          <Ionicons name={material?.icon || "leaf-outline"} size={25} color={C.green} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.materialEyebrow}>SELECTED MATERIAL</Text>
          <Text style={styles.materialName}>
            {material?.name || "Recyclable Material"}
          </Text>
          <Text style={styles.materialCategory}>
            {formatMaterial(materialId)} · {material?.category || "recyclable"}
          </Text>
        </View>
        <TouchableOpacity onPress={() => go("result")} style={styles.editMaterial}>
          <Ionicons name="create-outline" size={16} color={C.green} />
          <Text style={styles.editMaterialText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <Card>
        <View style={styles.cardHeading}>
          <View>
            <Text style={styles.headingTitle}>How much do you have?</Text>
            <Text style={styles.headingText}>Choose a measurement type and enter the amount</Text>
          </View>
          <Ionicons name="calculator-outline" size={24} color="#16874a" />
        </View>

        <Text style={styles.label}>Measurement type</Text>
        <View style={styles.unitsRow}>
          {UNITS.map((item) => {
            const selected = unit === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.75}
                onPress={() => changeUnit(item.id)}
                style={[styles.unitButton, selected && styles.unitButtonSelected]}
              >
                <View style={[styles.unitIcon, selected && styles.unitIconSelected]}>
                  <Ionicons
                    name={item.icon}
                    size={19}
                    color={selected ? "#fff" : "#16874a"}
                  />
                </View>
                <Text style={[styles.unitShort, selected && styles.unitShortSelected]}>
                  {item.short}
                </Text>
                <Text style={[styles.unitLabel, selected && styles.unitLabelSelected]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>Quantity</Text>
        <View style={[styles.quantityInputShell, valid && styles.quantityInputValid]}>
          <TextInput
            style={styles.quantityInput}
            keyboardType="decimal-pad"
            value={String(quantity ?? "")}
            onChangeText={changeQuantity}
            placeholder="0"
            placeholderTextColor="#9aaca7"
            selectionColor={C.green}
          />
          <View style={styles.unitSuffix}>
            <Text style={styles.unitSuffixText}>{unitInfo.short}</Text>
          </View>
        </View>

        <Text style={styles.quickLabel}>Quick select</Text>
        <View style={styles.presets}>
          {PRESETS[unit].map((value) => {
            const selectedPreset = Number(quantity) === value;
            return (
              <TouchableOpacity
                key={value}
                onPress={() => setQuantity(String(value))}
                style={[styles.preset, selectedPreset && styles.presetSelected]}
              >
                <Text style={[styles.presetText, selectedPreset && styles.presetTextSelected]}>
                  {value} {unitInfo.short}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {unit !== "kg" && valid && (
          <View style={styles.equivalentBox}>
            <View style={styles.equivalentIcon}>
              <Ionicons name="swap-horizontal-outline" size={18} color="#16874a" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.equivalentLabel}>ESTIMATED KG EQUIVALENT</Text>
              <Text style={styles.equivalentValue}>{kgEquivalent.toFixed(3)} kg</Text>
              {unit === "pieces" && (
                <Text style={styles.pieceText}>
                  Approximately {(pieceWeight * 1000).toFixed(0)} g per piece
                </Text>
              )}
            </View>
          </View>
        )}
      </Card>

      <View style={styles.rateSectionHeader}>
        <View>
          <Text style={styles.rateSectionTitle}>Current price</Text>
          <Text style={styles.rateSectionText}>Live rate or average fallback</Text>
        </View>
        {rateLoading ? (
          <ActivityIndicator size="small" color={C.green} />
        ) : (
          <Pill
            solid={usingAdminRate}
            text={usingAdminRate ? "ADMIN RATE" : "AVERAGE RATE"}
          />
        )}
      </View>

      <View
        style={[
          styles.rateCard,
          usingAdminRate ? styles.rateCardAdmin : styles.rateCardFallback,
        ]}
      >
        <View style={styles.rateTop}>
          <View style={[styles.rateIcon, !usingAdminRate && styles.rateIconFallback]}>
            <Ionicons
              name={usingAdminRate ? "cloud-done-outline" : "analytics-outline"}
              size={25}
              color={usingAdminRate ? "#16874a" : "#a57a15"}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.rateCaption, !usingAdminRate && { color: "#8a6b1f" }]}>
              {usingAdminRate ? "PUBLISHED FIREBASE PRICE" : "TEMPORARY AVERAGE PRICE"}
            </Text>
            <Text style={styles.rateValue}>₹{effectiveRate.toFixed(2)}</Text>
            <Text style={styles.rateUnit}>per kilogram</Text>
          </View>
        </View>

        <View style={styles.rateDivider} />
        <View style={styles.rateFooter}>
          <Ionicons
            name={usingAdminRate ? "calendar-outline" : "information-circle-outline"}
            size={15}
            color={usingAdminRate ? "#16874a" : "#9a761d"}
          />
          <Text style={[styles.rateFooterText, !usingAdminRate && { color: "#80691e" }]}>
            {usingAdminRate
              ? publishedMonth
                ? `Published for ${formatRateMonth(publishedMonth)}`
                : "Published by the administrator"
              : "No current admin price; using the material average"}
          </Text>
        </View>
      </View>

      {!!rateError && (
        <View style={styles.errorBox}>
          <Ionicons name="cloud-offline-outline" size={19} color={C.red} />
          <Text style={styles.errorText}>
            Live price unavailable. The average fallback rate is being used.
          </Text>
        </View>
      )}

      <View style={styles.estimateCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.estimateLabel}>ESTIMATED PICKUP VALUE</Text>
          <Text style={styles.estimateValue}>₹{total.toFixed(0)}</Text>
          {valid ? (
            <Text style={styles.formula}>
              {kgEquivalent.toFixed(3)} kg × ₹{effectiveRate.toFixed(2)}/kg
            </Text>
          ) : (
            <Text style={styles.formula}>Enter a quantity to calculate</Text>
          )}
        </View>
        <View style={styles.walletIcon}>
          <Ionicons name="wallet-outline" size={29} color={C.green} />
        </View>
      </View>

      <View style={styles.verificationNote}>
        <Ionicons name="shield-checkmark-outline" size={21} color={C.green} />
        <View style={{ flex: 1, marginLeft: 9 }}>
          <Text style={styles.verificationTitle}>Collector verification required</Text>
          <Text style={styles.verificationText}>
            This is an estimate. Final payment uses the collector-confirmed material, measured weight, quality and current published rate.
          </Text>
        </View>
      </View>

      <Btn
        icon="location-outline"
        disabled={!valid || (rateLoading && cachedRate <= 0)}
        title={
          rateLoading && cachedRate <= 0
            ? "Fetching Current Price…"
            : "Find Nearby Collectors"
        }
        onPress={next}
      />
    </ScrollView>
  );
}

function Step({ number, icon, label, active, complete }) {
  return (
    <View style={styles.step}>
      <View style={[styles.stepCircle, (active || complete) && styles.stepCircleActive]}>
        {icon ? (
          <Ionicons name={icon} size={14} color={C.bg} />
        ) : (
          <Text style={[styles.stepNumber, active && { color: C.bg }]}>{number}</Text>
        )}
      </View>
      <Text style={[styles.stepLabel, (active || complete) && styles.stepLabelActive]}>
        {label}
      </Text>
    </View>
  );
}

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

const styles = {
  steps: { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 20, marginVertical: 11 },
  step: { width: 65, alignItems: "center" },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.line,
  },
  stepCircleActive: { backgroundColor: C.green, borderColor: C.green },
  stepNumber: { color: C.muted, fontSize: 9, fontWeight: "900" },
  stepLabel: { color: C.muted, fontSize: 8, marginTop: 4 },
  stepLabelActive: { color: C.green, fontWeight: "800" },
  stepLineActive: { flex: 1, height: 1, marginTop: 14, backgroundColor: C.green },
  materialBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 11,
    borderRadius: 14,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.line,
  },
  materialIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    backgroundColor: "rgba(32,211,90,.12)",
  },
  materialEyebrow: { color: C.green, fontSize: 7, fontWeight: "900", letterSpacing: 0.8 },
  materialName: { color: C.text, fontSize: 14, fontWeight: "900", marginTop: 3 },
  materialCategory: { color: C.muted, fontSize: 8, marginTop: 3, textTransform: "capitalize" },
  editMaterial: { flexDirection: "row", alignItems: "center", padding: 8 },
  editMaterialText: { color: C.green, fontSize: 8, fontWeight: "900", marginLeft: 3 },
  cardHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 17 },
  headingTitle: { color: "#173a31", fontSize: 14, fontWeight: "900" },
  headingText: { color: "#78918b", fontSize: 8, marginTop: 3 },
  label: { color: "#42695d", fontSize: 9, fontWeight: "900", marginBottom: 7 },
  unitsRow: { flexDirection: "row", marginHorizontal: -4, marginBottom: 17 },
  unitButton: {
    flex: 1,
    minHeight: 87,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#d6e3df",
    backgroundColor: "#fff",
  },
  unitButtonSelected: { borderColor: C.green, backgroundColor: "#e7faed" },
  unitIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e6f6eb",
  },
  unitIconSelected: { backgroundColor: C.green },
  unitShort: { color: "#42695d", fontSize: 12, fontWeight: "900", marginTop: 5 },
  unitShortSelected: { color: "#167340" },
  unitLabel: { color: "#81958f", fontSize: 7, marginTop: 1 },
  unitLabelSelected: { color: "#37825a" },
  quantityInputShell: {
    height: 65,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 14,
    borderWidth: 1.5,
    borderColor: "#ccd9d5",
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  quantityInputValid: { borderColor: C.green },
  quantityInput: { flex: 1, height: 62, color: "#173a31", fontSize: 25, fontWeight: "900" },
  unitSuffix: {
    minWidth: 65,
    height: 43,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
    borderRadius: 9,
    backgroundColor: "#e7f7ec",
  },
  unitSuffixText: { color: "#16874a", fontSize: 12, fontWeight: "900" },
  quickLabel: { color: "#78918b", fontSize: 8, marginTop: 10, marginBottom: 6 },
  presets: { flexDirection: "row", marginHorizontal: -3, marginBottom: 4 },
  preset: {
    flex: 1,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 3,
    borderRadius: 8,
    backgroundColor: "#edf5f2",
  },
  presetSelected: { backgroundColor: C.green },
  presetText: { color: "#527069", fontSize: 8, fontWeight: "800" },
  presetTextSelected: { color: C.bg },
  equivalentBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    marginTop: 10,
    borderRadius: 10,
    backgroundColor: "#eef8f1",
  },
  equivalentIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
    backgroundColor: "#ddf4e5",
  },
  equivalentLabel: { color: "#5f7b72", fontSize: 7, fontWeight: "900" },
  equivalentValue: { color: "#173a31", fontSize: 14, fontWeight: "900", marginTop: 2 },
  pieceText: { color: "#718b82", fontSize: 7, marginTop: 2 },
  rateSectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 18, marginBottom: 9 },
  rateSectionTitle: { color: C.text, fontSize: 14, fontWeight: "900" },
  rateSectionText: { color: C.muted, fontSize: 8, marginTop: 2 },
  rateCard: { padding: 14, borderRadius: 14, borderWidth: 1 },
  rateCardAdmin: { backgroundColor: "#e7fff0", borderColor: "#b6e8c7" },
  rateCardFallback: { backgroundColor: "#fff8df", borderColor: "#eedb9c" },
  rateTop: { flexDirection: "row", alignItems: "center" },
  rateIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
    backgroundColor: "#d5f5e0",
  },
  rateIconFallback: { backgroundColor: "#ffedb5" },
  rateCaption: { color: "#347052", fontSize: 7, fontWeight: "900", letterSpacing: 0.7 },
  rateValue: { color: "#173a31", fontSize: 24, fontWeight: "900", marginTop: 2 },
  rateUnit: { color: "#668078", fontSize: 8 },
  rateDivider: { height: 1, backgroundColor: "rgba(40,90,70,.13)", marginVertical: 10 },
  rateFooter: { flexDirection: "row", alignItems: "center" },
  rateFooterText: { flex: 1, color: "#55756a", fontSize: 8, marginLeft: 6 },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    marginTop: 8,
    borderRadius: 9,
    backgroundColor: "#ffe9eb",
  },
  errorText: { flex: 1, color: "#9b3540", fontSize: 8, lineHeight: 13, marginLeft: 7 },
  estimateCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    marginTop: 11,
    borderRadius: 15,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.green,
  },
  estimateLabel: { color: C.green, fontSize: 7, fontWeight: "900", letterSpacing: 0.8 },
  estimateValue: { color: C.text, fontSize: 31, fontWeight: "900", marginTop: 4 },
  formula: { color: C.muted, fontSize: 8, marginTop: 2 },
  walletIcon: {
    width: 55,
    height: 55,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(32,211,90,.11)",
  },
  verificationNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    marginVertical: 11,
    borderRadius: 12,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.line,
  },
  verificationTitle: { color: C.text, fontSize: 9, fontWeight: "900" },
  verificationText: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 3 },
};
