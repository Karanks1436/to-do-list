import React, { useMemo } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Card, Header, Pill } from "../components/UI";
import { C } from "../theme";
import { s } from "../styles";

const ACTIVE_PICKUP_STATUSES = [
  "requested",
  "accepted",
  "on_the_way",
  "arrived",
];

export default function CollectorsScreen({
  go,
  collectors = [],
  pickups = [],
  requestPickup,
  busy,
  locationLoading = false,
  locationError = null,
  currentLocation = null,
  refreshLocation,
}) {
  // Build a live collector → active pickup lookup. The giver pickup listener in
  // Trash2TreasureApp updates this automatically when a collector accepts.
  const activePickupByCollector = useMemo(() => {
    const result = new Map();

    [...pickups]
      .sort(
        (first, second) =>
          timestamp(second.updatedAt || second.createdAt) -
          timestamp(first.updatedAt || first.createdAt)
      )
      .forEach((pickup) => {
        if (
          pickup.collectorId &&
          ACTIVE_PICKUP_STATUSES.includes(pickup.status) &&
          !result.has(pickup.collectorId)
        ) {
          result.set(pickup.collectorId, pickup);
        }
      });

    return result;
  }, [pickups]);

  const sortedCollectors = useMemo(
    () =>
      [...collectors].sort((first, second) => {
        const firstHasPickup = activePickupByCollector.has(first.id) ? 1 : 0;
        const secondHasPickup = activePickupByCollector.has(second.id) ? 1 : 0;
        if (firstHasPickup !== secondHasPickup) return secondHasPickup - firstHasPickup;
        return Number(first.distanceKm ?? 999999) - Number(second.distanceKm ?? 999999);
      }),
    [collectors, activePickupByCollector]
  );

  const handleRequest = async (collector) => {
    try {
      await requestPickup(collector);
    } catch (error) {
      Alert.alert(
        "Request failed",
        error?.message || "Unable to request this collector."
      );
    }
  };

  return (
    <ScrollView
      contentContainerStyle={s.page}
      showsVerticalScrollIndicator={false}
    >
      <Header title="Nearby Collectors" back={() => go("home")} />

      <Card>
        <View style={s.between}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <View style={styles.locationTitleRow}>
              <Ionicons name="navigate-circle" color={C.green} size={22} />
              <Text style={[s.whiteTitle, { marginLeft: 7 }]}>Your Location</Text>
            </View>

            <Text style={s.small}>
              {locationLoading
                ? "Getting your current GPS location…"
                : currentLocation
                ? "Current GPS location detected"
                : locationError || "Location has not been detected"}
            </Text>

            {currentLocation && (
              <Text style={[s.small, { marginTop: 4 }]}>
                {Number(currentLocation.latitude).toFixed(5)},{" "}
                {Number(currentLocation.longitude).toFixed(5)}
              </Text>
            )}
          </View>

          <TouchableOpacity
            disabled={locationLoading}
            activeOpacity={0.7}
            onPress={refreshLocation}
          >
            <Pill solid text={locationLoading ? "Loading…" : "Refresh"} />
          </TouchableOpacity>
        </View>
      </Card>

      {!!pickups.some((pickup) => ACTIVE_PICKUP_STATUSES.includes(pickup.status)) && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => go("tracking")}
          style={styles.activePickupBanner}
        >
          <View style={styles.activePickupIcon}>
            <Ionicons name="navigate" size={21} color={C.bg} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.activePickupTitle}>You have an active pickup</Text>
            <Text style={styles.activePickupText}>
              Open tracking to see the collector's latest status.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={C.green} />
        </TouchableOpacity>
      )}

      <View style={styles.sectionHeader}>
        <Text style={s.section}>Available Collectors</Text>
        <Text style={styles.foundText}>{collectors.length} found</Text>
      </View>

      {!collectors.length && (
        <Card>
          <View style={styles.emptyContent}>
            <View style={styles.emptyIcon}>
              <Ionicons name="location-outline" color={C.green} size={38} />
            </View>
            <Text style={[s.whiteTitle, styles.emptyTitle]}>
              No Nearby Collectors Found
            </Text>
            <Text style={[s.small, styles.emptyText]}>
              Approved and available collectors with saved GPS details inside their
              service radius will appear here.
            </Text>

            {!currentLocation && (
              <TouchableOpacity
                activeOpacity={0.75}
                disabled={locationLoading}
                onPress={refreshLocation}
                style={[
                  styles.locationButton,
                  locationLoading && { opacity: 0.5 },
                ]}
              >
                <Text style={styles.locationButtonText}>
                  {locationLoading ? "Getting Location…" : "Use My Location"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Card>
      )}

      {sortedCollectors.map((collector) => (
        <CollectorCard
          key={collector.id}
          collector={collector}
          activePickup={activePickupByCollector.get(collector.id)}
          isRequesting={busy === collector.id}
          request={() => handleRequest(collector)}
          track={() => go("tracking")}
        />
      ))}
    </ScrollView>
  );
}

function CollectorCard({
  collector,
  activePickup,
  isRequesting,
  request,
  track,
}) {
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
  const hasDistance = Number.isFinite(Number(collector.distanceKm));
  const distanceText = hasDistance
    ? `${Number(collector.distanceKm).toFixed(1)} km away`
    : "Distance unavailable";
  const acceptedMaterials = collector.acceptedMaterials || [];
  const pickupState = activePickup ? pickupStatus(activePickup.status) : null;
  const requestAccepted = ["accepted", "on_the_way", "arrived"].includes(
    activePickup?.status
  );

  return (
    <Card style={requestAccepted ? styles.acceptedCard : undefined}>
      {activePickup && (
        <View
          style={[
            styles.requestStatusBanner,
            requestAccepted && styles.acceptedStatusBanner,
          ]}
        >
          <Ionicons
            name={pickupState.icon}
            color={requestAccepted ? "#087a39" : "#876c16"}
            size={18}
          />
          <View style={{ flex: 1, marginLeft: 7 }}>
            <Text
              style={[
                styles.requestStatusTitle,
                requestAccepted && { color: "#087a39" },
              ]}
            >
              {pickupState.title}
            </Text>
            <Text style={styles.requestStatusText}>{pickupState.description}</Text>
          </View>
          <Pill
            solid={requestAccepted}
            text={pickupState.badge}
          />
        </View>
      )}

      <View style={styles.collectorTop}>
        <View style={styles.collectorAvatar}>
          <Ionicons name="business" color={C.green} size={24} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[s.whiteTitle, { fontSize: 15 }]}>{collectorName}</Text>

          <View style={styles.distanceRow}>
            <Ionicons name="location" size={13} color={C.green} />
            <Text style={[s.small, { marginLeft: 4 }]}>{distanceText}</Text>
          </View>

          {!!completeAddress && (
            <Text style={[s.small, styles.address]}>{completeAddress}</Text>
          )}

          <Text style={[s.small, { marginTop: 5 }]}>
            Service radius: {collector.serviceRadiusKm || 10} km
          </Text>
          <Text style={[s.small, { marginTop: 3 }]}>
            Phone: {collector.phone || "Not provided"}
          </Text>
        </View>

        <View style={{ alignItems: "flex-end" }}>
          <View style={styles.ratingRow}>
            <Ionicons name="star" color="#f4b740" size={14} />
            <Text style={styles.ratingText}>{collector.rating || "New"}</Text>
          </View>
          {collector.status === "active" && (
            <View style={{ marginTop: 6 }}>
              <Pill text="Verified" />
            </View>
          )}
        </View>
      </View>

      {!!acceptedMaterials.length && (
        <View style={{ marginTop: 13 }}>
          <Text style={styles.materialHeading}>Accepted Materials</Text>
          <View style={styles.materialsRow}>
            {acceptedMaterials.map((material) => (
              <View key={material} style={styles.materialChip}>
                <Text style={styles.materialText}>
                  {formatMaterialName(material)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {activePickup ? (
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={track}
          style={[
            styles.requestButton,
            requestAccepted
              ? styles.acceptedButton
              : styles.requestPendingButton,
          ]}
        >
          <Ionicons
            name={requestAccepted ? "checkmark-circle" : "time-outline"}
            color={requestAccepted ? "#fff" : "#725d14"}
            size={18}
          />
          <Text
            style={[
              styles.requestButtonText,
              !requestAccepted && { color: "#725d14" },
            ]}
          >
            {pickupState.buttonText}
          </Text>
          <Ionicons
            name="chevron-forward"
            color={requestAccepted ? "#fff" : "#725d14"}
            size={18}
          />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          disabled={isRequesting}
          activeOpacity={0.75}
          onPress={request}
          style={[
            styles.requestButton,
            { backgroundColor: C.green },
            isRequesting && { opacity: 0.5 },
          ]}
        >
          <Ionicons
            name={isRequesting ? "hourglass-outline" : "calendar-outline"}
            color={C.bg}
            size={17}
          />
          <Text style={[styles.requestButtonText, { color: C.bg }]}> 
            {isRequesting ? "Sending Request…" : "Request Pickup"}
          </Text>
        </TouchableOpacity>
      )}
    </Card>
  );
}

function pickupStatus(status) {
  const states = {
    requested: {
      title: "Pickup request sent",
      description: "Waiting for this collector to accept or decline.",
      badge: "REQUESTED",
      buttonText: "Request Sent · Track Status",
      icon: "time-outline",
    },
    accepted: {
      title: "Request accepted",
      description: "This collector accepted your pickup request.",
      badge: "ACCEPTED",
      buttonText: "Accepted · Track Pickup",
      icon: "checkmark-circle",
    },
    on_the_way: {
      title: "Collector is on the way",
      description: "Keep your recyclable material ready for verification.",
      badge: "ON THE WAY",
      buttonText: "On the Way · Track Pickup",
      icon: "bicycle-outline",
    },
    arrived: {
      title: "Collector has arrived",
      description: "Material category and weight will now be verified.",
      badge: "ARRIVED",
      buttonText: "Arrived · View Pickup",
      icon: "location",
    },
  };
  return states[status] || states.requested;
}

function formatMaterialName(value) {
  const labels = {
    plastic_pet: "Plastic PET",
    plastic_hdpe: "HDPE Plastic",
    plastic_ldpe: "LDPE Plastic",
    mixed_plastic: "Mixed Plastic",
    cardboard: "Cardboard",
    paper: "Paper",
    newspaper: "Newspaper",
    glass: "Glass",
    metal_aluminium: "Aluminium",
    metal_steel: "Steel",
    metal_iron: "Iron",
    metal_copper: "Copper",
    metal_brass: "Brass",
    ewaste: "E-Waste",
    organic: "Organic",
    textile: "Textile",
  };

  return (
    labels[value] ||
    String(value || "Material")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

function toDate(value) {
  if (!value) return null;
  const date = value?.toDate?.() || new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function timestamp(value) {
  return toDate(value)?.getTime() || 0;
}

const styles = {
  locationTitleRow: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  activePickupBanner: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 68,
    padding: 12,
    marginTop: 2,
    borderRadius: 13,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.green,
  },
  activePickupIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.green,
    marginRight: 10,
  },
  activePickupTitle: { color: C.text, fontSize: 12, fontWeight: "800" },
  activePickupText: { color: C.muted, fontSize: 9, marginTop: 3 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    marginBottom: 12,
  },
  foundText: { color: C.green, fontSize: 12, fontWeight: "700" },
  emptyContent: { alignItems: "center", paddingVertical: 25, paddingHorizontal: 10 },
  emptyIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(32,211,90,.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: 17, textAlign: "center", marginTop: 14 },
  emptyText: { textAlign: "center", lineHeight: 18, marginTop: 7 },
  locationButton: {
    minWidth: 170,
    height: 42,
    borderRadius: 10,
    backgroundColor: C.green,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },
  locationButtonText: { color: C.bg, fontSize: 13, fontWeight: "800" },
  acceptedCard: { borderWidth: 2, borderColor: C.green },
  requestStatusBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    marginBottom: 13,
    borderRadius: 9,
    backgroundColor: "#fff6d9",
  },
  acceptedStatusBanner: { backgroundColor: "#ddf8e6" },
  requestStatusTitle: { color: "#876c16", fontSize: 11, fontWeight: "900" },
  requestStatusText: { color: "#647d76", fontSize: 9, marginTop: 2 },
  collectorTop: { flexDirection: "row", alignItems: "flex-start" },
  collectorAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#dff9e7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  distanceRow: { flexDirection: "row", alignItems: "center", marginTop: 5 },
  address: { marginTop: 5, lineHeight: 16 },
  ratingRow: { flexDirection: "row", alignItems: "center" },
  ratingText: { color: "#597068", fontWeight: "700", marginLeft: 3, fontSize: 11 },
  materialHeading: { color: "#42695d", fontSize: 11, fontWeight: "700", marginBottom: 7 },
  materialsRow: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -3 },
  materialChip: {
    backgroundColor: "#e9f7ed",
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 5,
    margin: 3,
  },
  materialText: { color: "#367552", fontSize: 10, fontWeight: "600" },
  requestButton: {
    height: 46,
    flexDirection: "row",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
    paddingHorizontal: 12,
  },
  requestPendingButton: { backgroundColor: "#fff0b9" },
  acceptedButton: { backgroundColor: "#15964b" },
  requestButtonText: { flex: 1, textAlign: "center", fontSize: 12, fontWeight: "900" },
};
