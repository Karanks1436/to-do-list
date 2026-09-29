import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { Btn, Card, Header, Pill } from "../components/UI";
import { s } from "../styles";
import { C } from "../theme";

export const MATERIAL_OPTIONS = [
  { id: "plastic_pet", name: "Plastic (PET)", category: "plastic", icon: "water-outline" },
  { id: "plastic_hdpe", name: "Hard Plastic", category: "plastic", icon: "cube-outline" },
  { id: "metal_aluminium", name: "Aluminium / Can", category: "metal", icon: "disc-outline" },
  { id: "metal_steel", name: "Steel / Iron", category: "metal", icon: "construct-outline" },
  { id: "cardboard", name: "Cardboard", category: "paper", icon: "file-tray-stacked-outline" },
  { id: "paper", name: "Paper", category: "paper", icon: "document-text-outline" },
  { id: "glass", name: "Glass", category: "other", icon: "wine-outline" },
  { id: "ewaste", name: "Electronic Waste", category: "other", icon: "hardware-chip-outline" },
  { id: "organic", name: "Organic Waste", category: "other", icon: "leaf-outline" },
  { id: "textile", name: "Textile / Clothes", category: "other", icon: "shirt-outline" },
];

const FILTERS = [
  { id: "all", label: "All" },
  { id: "plastic", label: "Plastic" },
  { id: "metal", label: "Metal" },
  { id: "paper", label: "Paper" },
  { id: "other", label: "Other" },
];

export default function ResultScreen({
  go,
  image,
  saveScan,
  material,
  setMaterial,
  analysis,
  analyzeWaste,
}) {
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [localMaterial, setLocalMaterial] = useState(material || null);
  const attempted = useRef(false);

  useEffect(() => {
    if (material) setLocalMaterial(material);
  }, [material]);

  useEffect(() => {
    if (
      !image ||
      analysis ||
      attempted.current ||
      typeof analyzeWaste !== "function"
    ) {
      return;
    }
    attempted.current = true;
    runAnalysis();
  }, [image, analysis, analyzeWaste]);

  const selected = localMaterial || material;
  const visibleMaterials = useMemo(
    () =>
      filter === "all"
        ? MATERIAL_OPTIONS
        : MATERIAL_OPTIONS.filter((item) => item.category === filter),
    [filter]
  );

  async function runAnalysis() {
    if (typeof analyzeWaste !== "function") {
      setError("Automatic recognition is unavailable. Select the material manually below.");
      return;
    }

    try {
      setAnalyzing(true);
      setError(null);
      const result = await analyzeWaste();
      if (result?.materialId) {
        const match = MATERIAL_OPTIONS.find((item) => item.id === result.materialId);
        if (match) choose(match);
      }
    } catch (analysisError) {
      setError(
        analysisError?.message ||
          "Recognition could not identify the material. Select it manually below."
      );
    } finally {
      setAnalyzing(false);
    }
  }

  const choose = (item) => {
    setLocalMaterial(item);
    setMaterial?.(item);
    setError(null);
  };

  const next = async () => {
    if (!selected?.id) {
      return Alert.alert(
        "Select a material",
        "Choose the material that most closely matches the photographed item."
      );
    }

    try {
      setSaving(true);
      setMaterial?.(selected);
      if (typeof saveScan === "function") await saveScan(selected);
      go("quantity");
    } catch (saveError) {
      Alert.alert(
        "Unable to save scan",
        saveError?.message || "Check your connection and try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={s.page}
      showsVerticalScrollIndicator={false}
    >
      <Header title="Waste Identification" back={() => go("scan")} />

      <View style={styles.steps}>
        <Step icon="checkmark" label="Photo" complete />
        <View style={styles.stepLineActive} />
        <Step number="2" label="Material" active />
        <View style={styles.stepLine} />
        <Step number="3" label="Quantity" />
      </View>

      <Card style={styles.imageCard}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <View style={styles.noImage}>
            <Ionicons name="image-outline" size={58} color={C.muted} />
            <Text style={styles.noImageText}>Image preview unavailable</Text>
          </View>
        )}

        {!!image && <View pointerEvents="none" style={styles.imageShade} />}

        <View style={styles.photoBadge}>
          <Ionicons name="camera-outline" size={15} color="#fff" />
          <Text style={styles.photoBadgeText}>WASTE PHOTO</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => go("scan")}
          style={styles.changePhoto}
        >
          <Ionicons name="camera-reverse-outline" size={16} color="#fff" />
          <Text style={styles.changePhotoText}>Change</Text>
        </TouchableOpacity>

        <View style={styles.identificationPanel}>
          {analyzing ? (
            <View style={styles.analyzingRow}>
              <ActivityIndicator size="small" color={C.green} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.detectedLabel}>CHECKING IMAGE</Text>
                <Text style={styles.detectedName}>Identifying possible material…</Text>
              </View>
            </View>
          ) : (
            <View style={styles.detectedRow}>
              <View style={styles.detectedIcon}>
                <Ionicons
                  name={selected?.icon || "help-outline"}
                  size={23}
                  color={selected ? C.green : C.muted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.detectedLabel}>
                  {selected ? "SELECTED MATERIAL" : "MATERIAL REQUIRED"}
                </Text>
                <Text style={styles.detectedName}>
                  {selected?.name || "Choose a category below"}
                </Text>
                {!!analysis?.objectName && (
                  <Text style={styles.objectText}>Possible object: {analysis.objectName}</Text>
                )}
              </View>
              {analysis?.confidence != null && (
                <Pill
                  solid
                  text={`${Math.round(Number(analysis.confidence) * 100)}%`}
                />
              )}
            </View>
          )}
        </View>
      </Card>

      {!!analysis?.labels?.length && (
        <View style={styles.labelRow}>
          {analysis.labels.slice(0, 5).map((label, index) => (
            <View key={`${label}-${index}`} style={styles.labelChip}>
              <Text style={styles.labelText}>{String(label)}</Text>
            </View>
          ))}
        </View>
      )}

      {!!error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={20} color="#a76c18" />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.errorTitle}>Manual selection available</Text>
            <Text style={styles.errorText}>{error}</Text>
            {typeof analyzeWaste === "function" && (
              <TouchableOpacity
                disabled={analyzing}
                onPress={() => {
                  attempted.current = true;
                  runAnalysis();
                }}
              >
                <Text style={styles.retryText}>Try recognition again</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Confirm material</Text>
          <Text style={styles.sectionText}>Select the closest matching category</Text>
        </View>
        {!!selected && (
          <View style={styles.selectedBadge}>
            <Ionicons name="checkmark-circle" size={15} color={C.green} />
            <Text style={styles.selectedBadgeText}>SELECTED</Text>
          </View>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {FILTERS.map((item) => {
          const active = filter === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => setFilter(item.id)}
              style={[styles.filter, active && styles.filterActive]}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.materialGrid}>
        {visibleMaterials.map((item) => {
          const isSelected = selected?.id === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.75}
              onPress={() => choose(item)}
              style={[styles.materialCard, isSelected && styles.materialCardSelected]}
            >
              <View style={[styles.materialIcon, isSelected && styles.materialIconSelected]}>
                <Ionicons
                  name={item.icon}
                  size={22}
                  color={isSelected ? C.bg : C.green}
                />
              </View>
              <Text
                numberOfLines={2}
                style={[styles.materialName, isSelected && styles.materialNameSelected]}
              >
                {item.name}
              </Text>
              <View style={[styles.radio, isSelected && styles.radioSelected]}>
                {isSelected && <Ionicons name="checkmark" size={12} color={C.bg} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {!!selected && (
        <View style={styles.selectionSummary}>
          <View style={styles.summaryIcon}>
            <Ionicons name={selected.icon} size={23} color={C.green} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryLabel}>YOU SELECTED</Text>
            <Text style={styles.summaryName}>{selected.name}</Text>
            <Text style={styles.summaryId}>{selected.id}</Text>
          </View>
          <Ionicons name="checkmark-circle" size={25} color={C.green} />
        </View>
      )}

      <View style={styles.verificationBox}>
        <View style={styles.verificationIcon}>
          <Ionicons name="shield-checkmark-outline" size={23} color={C.green} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.verificationTitle}>Final verification at pickup</Text>
          <Text style={styles.verificationText}>
            This selection is an estimate. The collector confirms the material and measured weight before the final payment is calculated.
          </Text>
        </View>
      </View>

      <Btn
        icon="arrow-forward-circle-outline"
        disabled={saving || analyzing || !selected?.id}
        title={
          saving
            ? "Saving Selection…"
            : selected?.id
            ? "Continue to Quantity"
            : "Select a Material to Continue"
        }
        onPress={next}
      />
    </ScrollView>
  );
}

function Step({ number, icon, label, active, complete }) {
  return (
    <View style={styles.step}>
      <View
        style={[
          styles.stepCircle,
          (active || complete) && styles.stepCircleActive,
        ]}
      >
        {icon ? (
          <Ionicons name={icon} size={14} color={C.bg} />
        ) : (
          <Text style={[styles.stepNumber, (active || complete) && { color: C.bg }]}>
            {number}
          </Text>
        )}
      </View>
      <Text style={[styles.stepLabel, (active || complete) && styles.stepLabelActive]}>
        {label}
      </Text>
    </View>
  );
}

const styles = {
  steps: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    marginVertical: 11,
  },
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
  stepLine: { flex: 1, height: 1, marginTop: 14, backgroundColor: C.line },
  stepLineActive: { flex: 1, height: 1, marginTop: 14, backgroundColor: C.green },
  imageCard: {
    height: 360,
    padding: 0,
    overflow: "hidden",
    backgroundColor: "#102e32",
    borderWidth: 1,
    borderColor: C.green,
  },
  image: { width: "100%", height: "100%", resizeMode: "cover" },
  noImage: { flex: 1, alignItems: "center", justifyContent: "center" },
  noImageText: { color: C.muted, fontSize: 10, marginTop: 8 },
  imageShade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 145,
    backgroundColor: "rgba(0,0,0,.52)",
  },
  photoBadge: {
    position: "absolute",
    top: 11,
    left: 11,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,.56)",
  },
  photoBadgeText: { color: "#fff", fontSize: 7, fontWeight: "900", marginLeft: 4 },
  changePhoto: {
    position: "absolute",
    top: 11,
    right: 11,
    height: 34,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,.56)",
  },
  changePhotoText: { color: "#fff", fontSize: 8, fontWeight: "900", marginLeft: 4 },
  identificationPanel: {
    position: "absolute",
    left: 11,
    right: 11,
    bottom: 11,
    padding: 11,
    borderRadius: 12,
    backgroundColor: "rgba(3,25,29,.88)",
    borderWidth: 1,
    borderColor: "rgba(32,211,90,.42)",
  },
  detectedRow: { flexDirection: "row", alignItems: "center" },
  analyzingRow: { minHeight: 49, flexDirection: "row", alignItems: "center" },
  detectedIcon: {
    width: 43,
    height: 43,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
    backgroundColor: "rgba(32,211,90,.12)",
  },
  detectedLabel: { color: C.green, fontSize: 7, fontWeight: "900", letterSpacing: 0.8 },
  detectedName: { color: "#fff", fontSize: 14, fontWeight: "900", marginTop: 3 },
  objectText: { color: "rgba(255,255,255,.68)", fontSize: 8, marginTop: 2 },
  labelRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 1, marginBottom: 4 },
  labelChip: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginRight: 5,
    marginBottom: 5,
    borderRadius: 7,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.line,
  },
  labelText: { color: C.green, fontSize: 8 },
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 11,
    marginTop: 5,
    borderRadius: 11,
    backgroundColor: "#fff1d2",
  },
  errorTitle: { color: "#805913", fontSize: 10, fontWeight: "900" },
  errorText: { color: "#87682c", fontSize: 8, lineHeight: 13, marginTop: 3 },
  retryText: { color: "#16874a", fontSize: 9, fontWeight: "900", marginTop: 6 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 17,
    marginBottom: 10,
  },
  sectionTitle: { color: C.text, fontSize: 15, fontWeight: "900" },
  sectionText: { color: C.muted, fontSize: 8, marginTop: 3 },
  selectedBadge: { flexDirection: "row", alignItems: "center" },
  selectedBadgeText: { color: C.green, fontSize: 7, fontWeight: "900", marginLeft: 4 },
  filters: { paddingBottom: 10 },
  filter: {
    height: 34,
    justifyContent: "center",
    paddingHorizontal: 13,
    marginRight: 7,
    borderRadius: 10,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.line,
  },
  filterActive: { backgroundColor: C.green, borderColor: C.green },
  filterText: { color: C.muted, fontSize: 9, fontWeight: "800" },
  filterTextActive: { color: C.bg },
  materialGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4 },
  materialCard: {
    width: "47.8%",
    minHeight: 91,
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    margin: 4,
    borderRadius: 13,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.line,
  },
  materialCardSelected: { borderColor: C.green, backgroundColor: "rgba(32,211,90,.10)" },
  materialIcon: {
    width: 39,
    height: 39,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    backgroundColor: "rgba(32,211,90,.11)",
  },
  materialIconSelected: { backgroundColor: C.green },
  materialName: { flex: 1, color: C.text, fontSize: 9, lineHeight: 13, fontWeight: "700" },
  materialNameSelected: { color: C.green, fontWeight: "900" },
  radio: {
    position: "absolute",
    right: 7,
    top: 7,
    width: 17,
    height: 17,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.line,
  },
  radioSelected: { backgroundColor: C.green, borderColor: C.green },
  selectionSummary: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginTop: 10,
    borderRadius: 13,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.green,
  },
  summaryIcon: {
    width: 45,
    height: 45,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    backgroundColor: "rgba(32,211,90,.11)",
  },
  summaryLabel: { color: C.green, fontSize: 7, fontWeight: "900", letterSpacing: 0.7 },
  summaryName: { color: C.text, fontSize: 12, fontWeight: "900", marginTop: 3 },
  summaryId: { color: C.muted, fontSize: 7, marginTop: 2, textTransform: "uppercase" },
  verificationBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    marginVertical: 12,
    borderRadius: 12,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.line,
  },
  verificationIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
    backgroundColor: "rgba(32,211,90,.11)",
  },
  verificationTitle: { color: C.text, fontSize: 10, fontWeight: "900" },
  verificationText: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 3 },
};
