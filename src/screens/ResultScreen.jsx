import React, {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  Btn,
  Card,
  Header,
  Pill,
} from "../components/UI";
import { C } from "../theme";
import { s } from "../styles";

export const MATERIAL_OPTIONS = [
  {
    id: "plastic_pet",
    name: "Plastic (PET)",
    category: "plastic",
    icon: "water-outline",
  },
  {
    id: "plastic_hdpe",
    name: "Hard Plastic",
    category: "plastic",
    icon: "cube-outline",
  },
  {
    id: "metal_aluminium",
    name: "Aluminium / Can",
    category: "metal",
    icon: "cube-outline",
  },
  {
    id: "metal_steel",
    name: "Steel / Iron",
    category: "metal",
    icon: "construct-outline",
  },
  {
    id: "cardboard",
    name: "Cardboard",
    category: "cardboard",
    icon: "file-tray-stacked-outline",
  },
  {
    id: "paper",
    name: "Paper",
    category: "paper",
    icon: "document-text-outline",
  },
  {
    id: "glass",
    name: "Glass",
    category: "glass",
    icon: "wine-outline",
  },
  {
    id: "ewaste",
    name: "Electronic Waste",
    category: "ewaste",
    icon: "hardware-chip-outline",
  },
  {
    id: "organic",
    name: "Organic Waste",
    category: "organic",
    icon: "leaf-outline",
  },
  {
    id: "textile",
    name: "Textile / Clothes",
    category: "textile",
    icon: "shirt-outline",
  },
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
  const [saving, setSaving] =
    useState(false);

  const [analyzing, setAnalyzing] =
    useState(false);

  const [error, setError] =
    useState(null);

  /*
   * Keep an independent local selection so the
   * screen still works even when setMaterial was
   * accidentally not supplied by the parent.
   */
  const [
    localMaterial,
    setLocalMaterial,
  ] = useState(material || null);

  const analysisAttempted =
    useRef(false);

  /*
   * Synchronize parent material changes with the
   * screen's local selection.
   */
  useEffect(() => {
    if (material?.id) {
      setLocalMaterial(material);
    }
  }, [
    material?.id,
    material?.name,
    material?.category,
  ]);

  /*
   * Run recognition once when the image opens.
   */
  useEffect(() => {
    if (
      !image ||
      analysis ||
      analysisAttempted.current
    ) {
      return;
    }

    analysisAttempted.current = true;
    runAnalysis();
  }, [image, analysis]);

  const selectMaterial = (
    selectedMaterial
  ) => {
    if (!selectedMaterial?.id) {
      return;
    }

    setLocalMaterial(
      selectedMaterial
    );

    /*
     * Guard the parent setter so tapping another
     * material never causes:
     * "undefined is not a function".
     */
    if (
      typeof setMaterial === "function"
    ) {
      setMaterial(
        selectedMaterial
      );
    }

    setError(null);
  };

  const runAnalysis = async () => {
    if (
      typeof analyzeWaste !== "function"
    ) {
      setError(
        "Automatic recognition is unavailable. Please select the material manually."
      );

      return;
    }

    try {
      setAnalyzing(true);
      setError(null);

      const result =
        await analyzeWaste();

      if (!result?.materialId) {
        setError(
          "The object could not be identified confidently. Please select the correct material."
        );

        return;
      }

      const detectedMaterial =
        MATERIAL_OPTIONS.find(
          (item) =>
            item.id ===
            result.materialId
        );

      if (detectedMaterial) {
        selectMaterial(
          detectedMaterial
        );
      } else {
        setError(
          "The detected object is not in the supported material list. Please select the closest category."
        );
      }
    } catch (analysisError) {
      setError(
        analysisError?.message ||
          "Recognition failed. Please select the material manually."
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const retryAnalysis = () => {
    analysisAttempted.current = true;
    runAnalysis();
  };

  const next = async () => {
    const selectedMaterial =
      localMaterial || material;

    if (!selectedMaterial?.id) {
      Alert.alert(
        "Select material",
        "Choose the detected material or select the correct category manually."
      );

      return;
    }

    try {
      setSaving(true);

      /*
       * Synchronize the final selection with the
       * parent before saving.
       */
      if (
        typeof setMaterial ===
        "function"
      ) {
        setMaterial(
          selectedMaterial
        );
      }

      /*
       * Pass the selected material directly so
       * saveCurrentScan does not depend on an
       * asynchronous state update.
       */
      if (
        typeof saveScan === "function"
      ) {
        await saveScan(
          selectedMaterial
        );
      }

      if (typeof go === "function") {
        go("quantity");
      }
    } catch (saveError) {
      Alert.alert(
        "Upload failed",
        saveError?.message ||
          "Unable to save the waste details."
      );
    } finally {
      setSaving(false);
    }
  };

  const selectedMaterial =
    localMaterial || material;

  const confidenceValue =
    Number(analysis?.confidence);

  const hasConfidence =
    Number.isFinite(
      confidenceValue
    );

  const confidencePercent =
    hasConfidence
      ? Math.round(
          Math.min(
            Math.max(
              confidenceValue,
              0
            ),
            1
          ) * 100
        )
      : null;

  const detectedLabels =
    Array.isArray(analysis?.labels)
      ? analysis.labels
      : [];

  return (
    <ScrollView
      contentContainerStyle={s.page}
      showsVerticalScrollIndicator={
        false
      }
    >
      <Header
        title="Waste Identification"
        back={() => {
          if (
            typeof go === "function"
          ) {
            go("scan");
          }
        }}
      />

      <Card
        style={{
          padding: 0,
          overflow: "hidden",
        }}
      >
        {image ? (
          <Image
            source={{ uri: image }}
            style={{
              height: 245,
              width: "100%",
              resizeMode: "cover",
            }}
          />
        ) : (
          <View
            style={{
              height: 220,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor:
                "#e6efec",
            }}
          >
            <Ionicons
              name="image-outline"
              size={60}
              color={C.muted}
            />

            <Text
              style={[
                s.small,
                {
                  marginTop: 8,
                },
              ]}
            >
              No waste image selected
            </Text>
          </View>
        )}

        <View style={{ padding: 15 }}>
          {analyzing ? (
            <View
              style={{
                alignItems: "center",
                paddingVertical: 18,
              }}
            >
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor:
                    "#e5f8eb",
                  alignItems: "center",
                  justifyContent:
                    "center",
                }}
              >
                <Ionicons
                  name="sparkles"
                  size={28}
                  color={C.green}
                />
              </View>

              <Text
                style={[
                  s.whiteTitle,
                  {
                    marginTop: 10,
                    fontSize: 16,
                  },
                ]}
              >
                Identifying Waste…
              </Text>

              <Text
                style={[
                  s.small,
                  {
                    marginTop: 4,
                  },
                ]}
              >
                Checking the object and
                material type
              </Text>
            </View>
          ) : (
            <>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent:
                    "space-between",
                }}
              >
                <View
                  style={{
                    flex: 1,
                    paddingRight: 10,
                  }}
                >
                  <Text style={s.small}>
                    Detected Material
                  </Text>

                  <Text
                    style={[
                      s.whiteTitle,
                      {
                        fontSize: 19,
                        marginTop: 3,
                      },
                    ]}
                  >
                    {selectedMaterial?.name ||
                      "Not identified"}
                  </Text>

                  {selectedMaterial?.category && (
                    <Text
                      style={[
                        s.small,
                        {
                          marginTop: 4,
                          textTransform:
                            "capitalize",
                        },
                      ]}
                    >
                      Category:{" "}
                      {
                        selectedMaterial.category
                      }
                    </Text>
                  )}
                </View>

                {confidencePercent !==
                  null && (
                  <Pill
                    solid
                    text={`${confidencePercent}% confidence`}
                  />
                )}
              </View>

              {!!analysis?.objectName && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 11,
                  }}
                >
                  <Ionicons
                    name="search-outline"
                    size={15}
                    color={C.green}
                  />

                  <Text
                    style={[
                      s.small,
                      {
                        marginLeft: 6,
                      },
                    ]}
                  >
                    Object:{" "}
                    {analysis.objectName}
                  </Text>
                </View>
              )}

              {detectedLabels.length >
                0 && (
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 5,
                    marginTop: 11,
                  }}
                >
                  {detectedLabels
                    .slice(0, 6)
                    .map(
                      (
                        label,
                        index
                      ) => (
                        <View
                          key={`${String(
                            label
                          )}-${index}`}
                          style={{
                            backgroundColor:
                              "#e8f5ed",
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 7,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 9,
                              color:
                                "#367552",
                            }}
                          >
                            {String(label)}
                          </Text>
                        </View>
                      )
                    )}
                </View>
              )}
            </>
          )}
        </View>
      </Card>

      {error && (
        <View
          style={{
            backgroundColor: "#fff1dd",
            borderRadius: 10,
            padding: 12,
            marginBottom: 13,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
            }}
          >
            <Ionicons
              name="warning-outline"
              size={18}
              color="#9b6b24"
            />

            <Text
              style={{
                flex: 1,
                color: "#7c551b",
                fontSize: 11,
                lineHeight: 17,
                marginLeft: 7,
              }}
            >
              {error}
            </Text>
          </View>

          {typeof analyzeWaste ===
            "function" && (
            <TouchableOpacity
              activeOpacity={0.7}
              disabled={analyzing}
              onPress={retryAnalysis}
              style={{
                marginTop: 9,
              }}
            >
              <Text
                style={{
                  color: "#18804a",
                  fontWeight: "800",
                  fontSize: 12,
                }}
              >
                Try Recognition Again
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <Text style={s.section}>
        Confirm or Correct Material
      </Text>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 16,
        }}
      >
        {MATERIAL_OPTIONS.map(
          (item) => {
            const selected =
              selectedMaterial?.id ===
              item.id;

            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.75}
                onPress={() =>
                  selectMaterial(item)
                }
                style={{
                  width: "48.5%",
                  minHeight: 78,
                  borderRadius: 11,
                  borderWidth: 1.5,
                  borderColor: selected
                    ? C.green
                    : C.line,
                  backgroundColor:
                    selected
                      ? "#0d4a36"
                      : C.panel,
                  padding: 10,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    width: 35,
                    height: 35,
                    borderRadius: 18,
                    backgroundColor:
                      selected
                        ? C.green
                        : "#153a3f",
                    alignItems: "center",
                    justifyContent:
                      "center",
                    marginRight: 8,
                  }}
                >
                  <Ionicons
                    name={item.icon}
                    size={18}
                    color={
                      selected
                        ? C.bg
                        : C.green
                    }
                  />
                </View>

                <Text
                  style={{
                    flex: 1,
                    color: C.text,
                    fontSize: 11,
                    lineHeight: 15,
                    fontWeight: selected
                      ? "800"
                      : "600",
                  }}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }
        )}
      </View>

      <View
        style={{
          backgroundColor: "#0b3034",
          padding: 12,
          borderRadius: 10,
          marginBottom: 14,
          flexDirection: "row",
        }}
      >
        <Ionicons
          name="information-circle-outline"
          color={C.green}
          size={19}
        />

        <Text
          style={{
            flex: 1,
            color: C.muted,
            fontSize: 10,
            lineHeight: 16,
            marginLeft: 7,
          }}
        >
          Image recognition is an
          estimate. Correct the category
          here if necessary. The collector
          will verify the material and
          actual weight during pickup.
        </Text>
      </View>

      <Btn
        disabled={
          saving ||
          analyzing ||
          !selectedMaterial?.id
        }
        title={
          saving
            ? "Saving…"
            : "Enter Quantity"
        }
        onPress={next}
      />
    </ScrollView>
  );
}