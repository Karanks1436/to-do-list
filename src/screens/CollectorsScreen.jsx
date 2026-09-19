import React from "react";
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  Card,
  Header,
  Pill,
} from "../components/UI";
import { C } from "../theme";
import { s } from "../styles";

export default function CollectorsScreen({
  go,
  collectors = [],
  requestPickup,
  busy,
  locationLoading = false,
  locationError = null,
  currentLocation = null,
  refreshLocation,
}) {
  const handleRequest = async (
    collector
  ) => {
    try {
      await requestPickup(collector);
    } catch (error) {
      Alert.alert(
        "Request failed",
        error?.message ||
          "Unable to request this collector."
      );
    }
  };

  return (
    <ScrollView
      contentContainerStyle={s.page}
      showsVerticalScrollIndicator={false}
    >
      <Header
        title="Nearby Collectors"
        back={() => go("home")}
      />

      {/* Current trash giver location */}
      <Card>
        <View style={s.between}>
          <View
            style={{
              flex: 1,
              paddingRight: 12,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 5,
              }}
            >
              <Ionicons
                name="navigate-circle"
                color={C.green}
                size={22}
              />

              <Text
                style={[
                  s.whiteTitle,
                  {
                    marginLeft: 7,
                  },
                ]}
              >
                Your Location
              </Text>
            </View>

            <Text style={s.small}>
              {locationLoading
                ? "Getting your current GPS location…"
                : currentLocation
                ? "Current GPS location detected"
                : locationError ||
                  "Location has not been detected"}
            </Text>

            {currentLocation && (
              <Text
                style={[
                  s.small,
                  {
                    marginTop: 4,
                  },
                ]}
              >
                {Number(
                  currentLocation.latitude
                ).toFixed(5)}
                ,{" "}
                {Number(
                  currentLocation.longitude
                ).toFixed(5)}
              </Text>
            )}
          </View>

          <TouchableOpacity
            disabled={locationLoading}
            activeOpacity={0.7}
            onPress={refreshLocation}
          >
            <Pill
              solid
              text={
                locationLoading
                  ? "Loading…"
                  : "Refresh"
              }
            />
          </TouchableOpacity>
        </View>
      </Card>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 12,
          marginBottom: 12,
        }}
      >
        <Text style={s.section}>
          Available Collectors
        </Text>

        <Text
          style={{
            color: C.green,
            fontSize: 12,
            fontWeight: "700",
          }}
        >
          {collectors.length} found
        </Text>
      </View>

      {/* No nearby collectors */}
      {!collectors.length && (
        <Card>
          <View
            style={{
              alignItems: "center",
              paddingVertical: 25,
              paddingHorizontal: 10,
            }}
          >
            <View
              style={{
                width: 70,
                height: 70,
                borderRadius: 35,
                backgroundColor:
                  "rgba(32, 211, 90, 0.12)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name="location-outline"
                color={C.green}
                size={38}
              />
            </View>

            <Text
              style={[
                s.whiteTitle,
                {
                  fontSize: 17,
                  textAlign: "center",
                  marginTop: 14,
                },
              ]}
            >
              No Nearby Collectors Found
            </Text>

            <Text
              style={[
                s.small,
                {
                  textAlign: "center",
                  lineHeight: 18,
                  marginTop: 7,
                },
              ]}
            >
              Approved collectors with saved
              GPS details inside their service
              radius will appear here.
            </Text>

            {!currentLocation && (
              <TouchableOpacity
                activeOpacity={0.75}
                disabled={locationLoading}
                onPress={refreshLocation}
                style={{
                  minWidth: 170,
                  height: 42,
                  borderRadius: 10,
                  backgroundColor: C.green,
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 18,
                  opacity: locationLoading
                    ? 0.5
                    : 1,
                }}
              >
                <Text
                  style={{
                    color: C.bg,
                    fontSize: 13,
                    fontWeight: "800",
                  }}
                >
                  {locationLoading
                    ? "Getting Location…"
                    : "Use My Location"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Card>
      )}

      {/* Collector cards */}
      {collectors.map((collector) => {
        const collectorName =
          collector.displayName ||
          collector.businessName ||
          collector.name ||
          "Collector";

        const completeAddress = [
          collector.addressLine,
          collector.city,
          collector.state,
          collector.postalCode,
        ]
          .filter(Boolean)
          .join(", ");

        const hasDistance =
          Number.isFinite(
            Number(
              collector.distanceKm
            )
          );

        const distanceText =
          hasDistance
            ? `${Number(
                collector.distanceKm
              ).toFixed(1)} km away`
            : "Distance unavailable";

        const isRequesting =
          busy === collector.id;

        const acceptedMaterials =
          collector.acceptedMaterials || [];

        return (
          <Card key={collector.id}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
              }}
            >
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 23,
                  backgroundColor:
                    "#dff9e7",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <Ionicons
                  name="business"
                  color={C.green}
                  size={24}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    s.whiteTitle,
                    {
                      fontSize: 15,
                    },
                  ]}
                >
                  {collectorName}
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 5,
                  }}
                >
                  <Ionicons
                    name="location"
                    size={13}
                    color={C.green}
                  />

                  <Text
                    style={[
                      s.small,
                      {
                        marginLeft: 4,
                      },
                    ]}
                  >
                    {distanceText}
                  </Text>
                </View>

                {!!completeAddress && (
                  <Text
                    style={[
                      s.small,
                      {
                        marginTop: 5,
                        lineHeight: 16,
                      },
                    ]}
                  >
                    {completeAddress}
                  </Text>
                )}

                <Text
                  style={[
                    s.small,
                    {
                      marginTop: 5,
                    },
                  ]}
                >
                  Service radius:{" "}
                  {collector.serviceRadiusKm ||
                    10}{" "}
                  km
                </Text>

                <Text
                  style={[
                    s.small,
                    {
                      marginTop: 3,
                    },
                  ]}
                >
                  Phone:{" "}
                  {collector.phone ||
                    "Not provided"}
                </Text>
              </View>

              <View
                style={{
                  alignItems: "flex-end",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <Ionicons
                    name="star"
                    color="#f4b740"
                    size={14}
                  />

                  <Text
                    style={[
                      s.small,
                      {
                        color: "#597068",
                        fontWeight: "700",
                        marginLeft: 3,
                      },
                    ]}
                  >
                    {collector.rating ||
                      "New"}
                  </Text>
                </View>

                {collector.status ===
                  "active" && (
                  <View
                    style={{
                      marginTop: 6,
                    }}
                  >
                    <Pill
                      text="Verified"
                    />
                  </View>
                )}
              </View>
            </View>

            {!!acceptedMaterials.length && (
              <View
                style={{
                  marginTop: 13,
                }}
              >
                <Text
                  style={{
                    color: "#42695d",
                    fontSize: 11,
                    fontWeight: "700",
                    marginBottom: 7,
                  }}
                >
                  Accepted Materials
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 6,
                  }}
                >
                  {acceptedMaterials.map(
                    (material) => (
                      <View
                        key={material}
                        style={{
                          backgroundColor:
                            "#e9f7ed",
                          borderRadius: 7,
                          paddingHorizontal: 8,
                          paddingVertical: 5,
                        }}
                      >
                        <Text
                          style={{
                            color:
                              "#367552",
                            fontSize: 10,
                            fontWeight: "600",
                          }}
                        >
                          {formatMaterialName(
                            material
                          )}
                        </Text>
                      </View>
                    )
                  )}
                </View>
              </View>
            )}

            <TouchableOpacity
              disabled={isRequesting}
              activeOpacity={0.75}
              onPress={() =>
                handleRequest(collector)
              }
              style={{
                height: 44,
                borderRadius: 10,
                backgroundColor: C.green,
                alignItems: "center",
                justifyContent: "center",
                marginTop: 15,
                opacity: isRequesting
                  ? 0.5
                  : 1,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Ionicons
                  name={
                    isRequesting
                      ? "hourglass-outline"
                      : "calendar-outline"
                  }
                  color={C.bg}
                  size={17}
                />

                <Text
                  style={{
                    color: C.bg,
                    fontSize: 13,
                    fontWeight: "800",
                    marginLeft: 7,
                  }}
                >
                  {isRequesting
                    ? "Sending Request…"
                    : "Request Pickup"}
                </Text>
              </View>
            </TouchableOpacity>
          </Card>
        );
      })}
    </ScrollView>
  );
}

function formatMaterialName(value) {
  const labels = {
    plastic_pet: "Plastic PET",
    cardboard: "Cardboard",
    paper: "Paper",
    glass: "Glass",
    metal_aluminium: "Aluminium",
    metal_steel: "Steel",
    ewaste: "E-Waste",
  };

  return (
    labels[value] ||
    String(value)
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      )
  );
}