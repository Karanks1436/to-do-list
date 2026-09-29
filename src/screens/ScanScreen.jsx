import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Btn, Header } from "../components/UI";
import { C } from "../theme";
import { s } from "../styles";

export default function ScanScreen({ go, image, pick }) {
  const [selecting, setSelecting] = useState(null);

  const selectImage = async (camera) => {
    if (typeof pick !== "function" || selecting) return;
    try {
      setSelecting(camera ? "camera" : "gallery");
      await pick(camera);
    } finally {
      setSelecting(null);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={s.page}
      showsVerticalScrollIndicator={false}
    >
      <Header title="Scan Waste" back={() => go("home")} />

      <View style={styles.introRow}>
        <View style={styles.introIcon}>
          <Ionicons name="scan-outline" size={25} color={C.green} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.introTitle}>Photograph your recyclable material</Text>
          <Text style={styles.introText}>
            Add one clear photo, then select the correct material category.
          </Text>
        </View>
      </View>

      <View style={styles.steps}>
        <Step number="1" label="Photo" active />
        <View style={styles.stepLine} />
        <Step number="2" label="Material" active={!!image} />
        <View style={styles.stepLine} />
        <Step number="3" label="Quantity" />
      </View>

      <View style={[styles.previewCard, image && styles.previewCardReady]}>
        {image ? (
          <>
            <Image source={{ uri: image }} style={styles.preview} />
            <LinearShade />

            <View style={styles.readyBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#fff" />
              <Text style={styles.readyText}>PHOTO READY</Text>
            </View>

            <View style={styles.previewFooter}>
              <View style={{ flex: 1 }}>
                <Text style={styles.previewTitle}>Photo selected</Text>
                <Text style={styles.previewText}>Review the image before continuing</Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.75}
                disabled={!!selecting}
                onPress={() => selectImage(true)}
                style={styles.retakeButton}
              >
                <Ionicons name="camera-reverse-outline" size={17} color="#fff" />
                <Text style={styles.retakeText}>Retake</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.placeholder}>
            <View style={styles.cameraCircle}>
              <Ionicons name="camera-outline" size={52} color={C.green} />
              <View style={styles.scanCornerTopLeft} />
              <View style={styles.scanCornerTopRight} />
              <View style={styles.scanCornerBottomLeft} />
              <View style={styles.scanCornerBottomRight} />
            </View>
            <Text style={styles.placeholderTitle}>No photo selected</Text>
            <Text style={styles.placeholderText}>
              Center the recyclable item and make sure it is clearly visible.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.sourceRow}>
        <SourceButton
          icon="camera-outline"
          title="Camera"
          subtitle="Take a new photo"
          loading={selecting === "camera"}
          disabled={!!selecting}
          onPress={() => selectImage(true)}
          primary
        />
        <SourceButton
          icon="images-outline"
          title="Gallery"
          subtitle="Choose an image"
          loading={selecting === "gallery"}
          disabled={!!selecting}
          onPress={() => selectImage(false)}
        />
      </View>

      <View style={styles.guidanceCard}>
        <View style={styles.guidanceHeader}>
          <View style={styles.guidanceIcon}>
            <Ionicons name="sparkles-outline" size={19} color="#d49b1b" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.guidanceTitle}>Tips for a useful photo</Text>
            <Text style={styles.guidanceSubtitle}>Help the collector verify it accurately</Text>
          </View>
        </View>
        <Tip icon="sunny-outline" text="Use bright, even lighting and avoid strong shadows." />
        <Tip icon="expand-outline" text="Keep the complete item inside the frame." />
        <Tip icon="layers-outline" text="Photograph one material type at a time when possible." />
        <Tip icon="eye-outline" text="Make sure labels and distinguishing features are visible." last />
      </View>

      <View style={styles.verificationNote}>
        <Ionicons name="shield-checkmark-outline" size={21} color={C.green} />
        <View style={{ flex: 1, marginLeft: 9 }}>
          <Text style={styles.verificationTitle}>Collector-verified settlement</Text>
          <Text style={styles.verificationText}>
            The photo helps document the request. Your collector confirms the final material category and weight before payment.
          </Text>
        </View>
      </View>

      {image ? (
        <Btn
          icon="arrow-forward-circle-outline"
          title="Continue to Material Selection"
          onPress={() => go("result")}
        />
      ) : (
        <View style={styles.disabledContinue}>
          <Ionicons name="image-outline" size={18} color={C.muted} />
          <Text style={styles.disabledText}>Add a photo to continue</Text>
        </View>
      )}

      <Text style={styles.privacyText}>
        Images are compressed and stored as Base64 in Firestore. Maximum decoded size: 700 KB.
      </Text>
    </ScrollView>
  );
}

function SourceButton({
  icon,
  title,
  subtitle,
  loading,
  disabled,
  onPress,
  primary,
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.sourceButton,
        primary && styles.sourceButtonPrimary,
        disabled && { opacity: 0.55 },
      ]}
    >
      <View style={[styles.sourceIcon, primary && styles.sourceIconPrimary]}>
        {loading ? (
          <ActivityIndicator size="small" color={primary ? C.bg : C.green} />
        ) : (
          <Ionicons name={icon} size={23} color={primary ? C.bg : C.green} />
        )}
      </View>
      <Text style={styles.sourceTitle}>{loading ? "Opening…" : title}</Text>
      <Text style={styles.sourceText}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

function Step({ number, label, active }) {
  return (
    <View style={styles.step}>
      <View style={[styles.stepCircle, active && styles.stepCircleActive]}>
        <Text style={[styles.stepNumber, active && styles.stepNumberActive]}>{number}</Text>
      </View>
      <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>{label}</Text>
    </View>
  );
}

function Tip({ icon, text, last }) {
  return (
    <View style={[styles.tipRow, last && { borderBottomWidth: 0 }]}>
      <Ionicons name={icon} size={16} color="#16874a" />
      <Text style={styles.tipText}>{text}</Text>
      <Ionicons name="checkmark-circle" size={15} color={C.green} />
    </View>
  );
}

function LinearShade() {
  return <View pointerEvents="none" style={styles.imageShade} />;
}

const styles = {
  introRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginTop: 5,
    marginBottom: 13,
    borderRadius: 13,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.line,
  },
  introIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    backgroundColor: "rgba(32,211,90,.12)",
  },
  introTitle: { color: C.text, fontSize: 11, fontWeight: "900" },
  introText: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 3 },
  steps: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingHorizontal: 18,
    marginBottom: 14,
  },
  step: { alignItems: "center", width: 58 },
  stepCircle: {
    width: 27,
    height: 27,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.line,
  },
  stepCircleActive: { backgroundColor: C.green, borderColor: C.green },
  stepNumber: { color: C.muted, fontSize: 9, fontWeight: "900" },
  stepNumberActive: { color: C.bg },
  stepLabel: { color: C.muted, fontSize: 8, marginTop: 4 },
  stepLabelActive: { color: C.green, fontWeight: "800" },
  stepLine: { flex: 1, height: 1, marginTop: 13, backgroundColor: C.line },
  previewCard: {
    width: "100%",
    aspectRatio: 0.84,
    overflow: "hidden",
    borderRadius: 18,
    backgroundColor: "#0b292e",
    borderWidth: 1,
    borderColor: C.line,
  },
  previewCardReady: { borderColor: C.green },
  preview: { width: "100%", height: "100%", resizeMode: "cover" },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  cameraCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(32,211,90,.08)",
  },
  scanCornerTopLeft: {
    position: "absolute",
    left: 4,
    top: 4,
    width: 25,
    height: 25,
    borderLeftWidth: 2,
    borderTopWidth: 2,
    borderColor: C.green,
  },
  scanCornerTopRight: {
    position: "absolute",
    right: 4,
    top: 4,
    width: 25,
    height: 25,
    borderRightWidth: 2,
    borderTopWidth: 2,
    borderColor: C.green,
  },
  scanCornerBottomLeft: {
    position: "absolute",
    left: 4,
    bottom: 4,
    width: 25,
    height: 25,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: C.green,
  },
  scanCornerBottomRight: {
    position: "absolute",
    right: 4,
    bottom: 4,
    width: 25,
    height: 25,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: C.green,
  },
  placeholderTitle: { color: C.text, fontSize: 14, fontWeight: "900", marginTop: 17 },
  placeholderText: { color: C.muted, fontSize: 9, lineHeight: 14, textAlign: "center", marginTop: 6 },
  imageShade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 110,
    backgroundColor: "rgba(0,0,0,.53)",
  },
  readyBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: "rgba(13,145,74,.90)",
  },
  readyText: { color: "#fff", fontSize: 8, fontWeight: "900", marginLeft: 4 },
  previewFooter: {
    position: "absolute",
    left: 13,
    right: 13,
    bottom: 13,
    flexDirection: "row",
    alignItems: "center",
  },
  previewTitle: { color: "#fff", fontSize: 13, fontWeight: "900" },
  previewText: { color: "rgba(255,255,255,.75)", fontSize: 8, marginTop: 3 },
  retakeButton: {
    height: 37,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,.19)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.35)",
  },
  retakeText: { color: "#fff", fontSize: 9, fontWeight: "900", marginLeft: 5 },
  sourceRow: { flexDirection: "row", marginHorizontal: -4, marginTop: 10 },
  sourceButton: {
    flex: 1,
    minHeight: 105,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
    borderRadius: 14,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.line,
  },
  sourceButtonPrimary: { borderColor: C.green },
  sourceIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(32,211,90,.11)",
  },
  sourceIconPrimary: { backgroundColor: C.green },
  sourceTitle: { color: C.text, fontSize: 10, fontWeight: "900", marginTop: 7 },
  sourceText: { color: C.muted, fontSize: 8, marginTop: 2 },
  guidanceCard: {
    padding: 13,
    marginTop: 13,
    borderRadius: 14,
    backgroundColor: "#f7fbfa",
  },
  guidanceHeader: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  guidanceIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
    backgroundColor: "#fff3ce",
  },
  guidanceTitle: { color: "#173a31", fontSize: 11, fontWeight: "900" },
  guidanceSubtitle: { color: "#78918b", fontSize: 8, marginTop: 2 },
  tipRow: {
    minHeight: 41,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#dfe9e7",
  },
  tipText: { flex: 1, color: "#527069", fontSize: 8, lineHeight: 13, marginHorizontal: 8 },
  verificationNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    marginVertical: 12,
    borderRadius: 12,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.line,
  },
  verificationTitle: { color: C.text, fontSize: 10, fontWeight: "900" },
  verificationText: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 3 },
  disabledContinue: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.line,
  },
  disabledText: { color: C.muted, fontSize: 10, fontWeight: "800", marginLeft: 7 },
  privacyText: { color: C.muted, fontSize: 7, lineHeight: 11, textAlign: "center", marginTop: 10, paddingHorizontal: 12 },
};
