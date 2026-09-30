// import React, { useEffect, useMemo, useState } from "react";
// import {
//   Alert,
//   KeyboardAvoidingView,
//   Linking,
//   Platform,
//   ScrollView,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import * as Location from "expo-location";

// import { Btn, Card, Header, Pill } from "../components/UI";
// import { saveCollectorDetails } from "../firebase/marketplaceService";
// import { C } from "../theme";
// import { s } from "../styles";

// const MATERIALS = [
//   ["plastic_pet", "PET Plastic"],
//   ["plastic_hdpe", "HDPE Plastic"],
//   ["mixed_plastic", "Mixed Plastic"],
//   ["cardboard", "Cardboard"],
//   ["paper", "Paper"],
//   ["newspaper", "Newspaper"],
//   ["glass", "Glass"],
//   ["metal_aluminium", "Aluminium"],
//   ["metal_steel", "Steel"],
//   ["metal_iron", "Iron"],
//   ["metal_copper", "Copper"],
//   ["ewaste", "E-waste"],
//   ["organic", "Organic"],
//   ["textile", "Textile"],
// ];

// const ACTIVE_STATUSES = ["accepted", "on_the_way", "arrived"];

// export default function CollectorDashboardScreen({
//   user,
//   profile,
//   pickups = [],
//   openPickups = [],
//   transactions = [],
//   unreadCount = 0,
//   go,
//   accept,
//   decline,
//   status,
//   complete,
//   logout,
// }) {
//   const [tab, setTab] = useState("overview");
//   const [jobFilter, setJobFilter] = useState("requests");
//   const [busy, setBusy] = useState(null);
//   const [weights, setWeights] = useState({});
//   const [verifiedMaterials, setVerifiedMaterials] = useState({});
//   const [notes, setNotes] = useState({});

//   const [businessName, setBusinessName] = useState("");
//   const [ownerName, setOwnerName] = useState("");
//   const [phone, setPhone] = useState("");
//   const [addressLine, setAddressLine] = useState("");
//   const [city, setCity] = useState("");
//   const [state, setState] = useState("Punjab");
//   const [postalCode, setPostalCode] = useState("");
//   const [serviceRadiusKm, setServiceRadiusKm] = useState("10");
//   const [acceptedMaterials, setAcceptedMaterials] = useState(MATERIALS.map(([id]) => id));
//   const [availableForPickups, setAvailableForPickups] = useState(true);
//   const [collectorLocation, setCollectorLocation] = useState(null);
//   const [gettingLocation, setGettingLocation] = useState(false);
//   const [saving, setSaving] = useState(false);

//   useEffect(() => {
//     setBusinessName(profile?.businessName || "");
//     setOwnerName(profile?.ownerName || profile?.name || "");
//     setPhone(profile?.phone || "");
//     setAddressLine(profile?.addressLine || "");
//     setCity(profile?.city || "");
//     setState(profile?.state || "Punjab");
//     setPostalCode(profile?.postalCode || "");
//     setServiceRadiusKm(String(profile?.serviceRadiusKm || 10));
//     setAcceptedMaterials(
//       profile?.acceptedMaterials?.length
//         ? profile.acceptedMaterials
//         : MATERIALS.map(([id]) => id)
//     );
//     setAvailableForPickups(profile?.availableForPickups !== false);
//     if (profile?.location?.latitude && profile?.location?.longitude) {
//       setCollectorLocation(profile.location);
//     }
//   }, [profile]);

//   const visibleOpenRequests = useMemo(
//     () =>
//       openPickups.filter(
//         (item) => !(item.declinedCollectorIds || []).includes(user?.uid)
//       ),
//     [openPickups, user?.uid]
//   );
//   const assignedRequests = pickups.filter((item) => item.status === "requested");
//   const declinedRequests = openPickups.filter((item) =>
//     (item.declinedCollectorIds || []).includes(user?.uid)
//   );
//   const newRequests = [...assignedRequests, ...visibleOpenRequests].filter(
//     (item, index, list) => list.findIndex((other) => other.id === item.id) === index
//   );
//   const activeJobs = pickups.filter((item) => ACTIVE_STATUSES.includes(item.status));
//   const completedJobs = pickups.filter((item) => item.status === "completed");
//   const responseHistory = [
//     ...pickups.filter((item) => item.status !== "requested"),
//     ...declinedRequests.map((item) => ({ ...item, collectorResponse: "declined" })),
//   ].filter(
//     (item, index, list) => list.findIndex((other) => other.id === item.id) === index
//   );
//   const earnings = transactions.reduce(
//     (sum, item) => sum + Number(item.amount || 0),
//     0
//   );
//   const recycledKg = transactions.reduce(
//     (sum, item) => sum + Number(item.weightKg || 0),
//     0
//   );

//   const captureLocation = async () => {
//     try {
//       setGettingLocation(true);
//       const permission = await Location.requestForegroundPermissionsAsync();
//       if (permission.status !== "granted") {
//         return Alert.alert(
//           "Permission required",
//           "Allow location so nearby users can find your collection service."
//         );
//       }
//       const result = await Location.getCurrentPositionAsync({
//         accuracy: Location.Accuracy.High,
//       });
//       setCollectorLocation({
//         latitude: result.coords.latitude,
//         longitude: result.coords.longitude,
//         accuracy: result.coords.accuracy,
//       });
//       Alert.alert("Location captured", "Save your profile to publish this location.");
//     } catch (error) {
//       Alert.alert("Location failed", error?.message || "Unable to get GPS location.");
//     } finally {
//       setGettingLocation(false);
//     }
//   };

//   const saveProfile = async () => {
//     if (!user?.uid) return Alert.alert("Account unavailable");
//     if (
//       !businessName.trim() ||
//       !ownerName.trim() ||
//       !phone.trim() ||
//       !addressLine.trim() ||
//       !city.trim() ||
//       !postalCode.trim()
//     ) {
//       return Alert.alert("Incomplete details", "Fill every required collector field.");
//     }
//     if (!collectorLocation) {
//       return Alert.alert("Location required", "Capture your current GPS location.");
//     }
//     if (!acceptedMaterials.length) {
//       return Alert.alert("Materials required", "Select at least one accepted material.");
//     }
//     const radius = Number(serviceRadiusKm);
//     if (!Number.isFinite(radius) || radius <= 0) {
//       return Alert.alert("Invalid radius", "Enter a service radius greater than zero.");
//     }

//     try {
//       setSaving(true);
//       await saveCollectorDetails(user.uid, {
//         businessName,
//         ownerName,
//         phone,
//         addressLine,
//         city,
//         state,
//         postalCode,
//         serviceRadiusKm: radius,
//         acceptedMaterials,
//         availableForPickups,
//         location: collectorLocation,
//       });
//       Alert.alert("Profile saved", "Your collector details and availability are updated.");
//     } catch (error) {
//       Alert.alert("Save failed", error?.message || "Unable to save collector details.");
//     } finally {
//       setSaving(false);
//     }
//   };

//   const runAction = async (key, action, successMessage) => {
//     try {
//       setBusy(key);
//       await action();
//       if (successMessage) Alert.alert("Response sent", successMessage);
//       return true;
//     } catch (error) {
//       Alert.alert("Action failed", error?.message || "Please try again.");
//       return false;
//     } finally {
//       setBusy(null);
//     }
//   };

//   const acceptRequest = async (pickup) => {
//     const accepted = await runAction(
//       `accept-${pickup.id}`,
//       () => accept(pickup.id),
//       "Pickup accepted. The giver has been notified. This pickup is now in Active."
//     );
//     if (accepted) setJobFilter("active");
//   };

//   const confirmDecline = (pickup) => {
//     Alert.alert(
//       "Decline pickup?",
//       "This request will be released to other approved collectors and hidden from your list.",
//       [
//         { text: "Cancel", style: "cancel" },
//         {
//           text: "Decline",
//           style: "destructive",
//           onPress: async () => {
//             const declined = await runAction(
//               `decline-${pickup.id}`,
//               () => decline(pickup.id, "Collector unavailable"),
//               "Pickup declined. The giver has been notified and the request was released to other collectors."
//             );
//             if (declined) setJobFilter("responses");
//           },
//         },
//       ]
//     );
//   };

//   const changeStatus = (pickupId, nextStatus) =>
//     runAction(
//       `status-${pickupId}`,
//       () => status(pickupId, nextStatus),
//       nextStatus === "on_the_way" ? "Trip started." : "Marked as arrived."
//     );

//   const finishPickup = (pickup) => {
//     const finalKg = Number(weights[pickup.id]);
//     const verifiedMaterialId = String(
//       verifiedMaterials[pickup.id] || pickup.materialId || ""
//     ).trim();
//     if (!Number.isFinite(finalKg) || finalKg <= 0) {
//       return Alert.alert("Weight required", "Enter the collector-verified weight in kg.");
//     }
//     if (!verifiedMaterialId) {
//       return Alert.alert("Material required", "Enter the verified material ID.");
//     }
//     Alert.alert(
//       "Complete pickup?",
//       `${finalKg.toFixed(2)} kg of ${formatMaterial(verifiedMaterialId)} will be settled at ₹${Number(
//         pickup.ratePerKg || 0
//       ).toFixed(2)}/kg.`,
//       [
//         { text: "Cancel", style: "cancel" },
//         {
//           text: "Complete",
//           onPress: () =>
//             runAction(
//               `complete-${pickup.id}`,
//               () =>
//                 complete(pickup.id, {
//                   finalKg,
//                   verifiedMaterialId,
//                   collectorNotes: notes[pickup.id] || "",
//                 }),
//               "Pickup completed and settlement recorded."
//             ).then(() => {
//               setWeights((current) => ({ ...current, [pickup.id]: "" }));
//               setNotes((current) => ({ ...current, [pickup.id]: "" }));
//             }),
//         },
//       ]
//     );
//   };

//   const openDirections = async (pickup) => {
//     const location = pickup.giverLocation;
//     const destination =
//       location?.latitude && location?.longitude
//         ? `${location.latitude},${location.longitude}`
//         : encodeURIComponent(formatAddress(pickup.address) || "");
//     if (!destination) {
//       return Alert.alert("Address unavailable", "The giver did not provide a pickup location.");
//     }
//     const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
//     try {
//       await Linking.openURL(url);
//     } catch (error) {
//       Alert.alert("Maps unavailable", error?.message || "Unable to open directions.");
//     }
//   };

//   const toggleMaterial = (id) => {
//     setAcceptedMaterials((current) =>
//       current.includes(id)
//         ? current.filter((item) => item !== id)
//         : [...current, id]
//     );
//   };

//   return (
//     <KeyboardAvoidingView
//       style={s.fill}
//       behavior={Platform.OS === "ios" ? "padding" : undefined}
//     >
//       <ScrollView
//         keyboardShouldPersistTaps="handled"
//         contentContainerStyle={s.page}
//         showsVerticalScrollIndicator={false}
//       >
//         <Header
//           title="Collector Dashboard"
//           right={
//             <TouchableOpacity
//               accessibilityLabel="Open notifications"
//               onPress={() => go?.("notifications")}
//               style={styles.notificationButton}
//             >
//               <Ionicons name="notifications-outline" size={21} color={C.green} />
//               {!!unreadCount && (
//                 <View style={styles.notificationBadge}>
//                   <Text style={styles.notificationBadgeText}>
//                     {unreadCount > 9 ? "9+" : unreadCount}
//                   </Text>
//                 </View>
//               )}
//             </TouchableOpacity>
//           }
//         />

//         <View style={styles.hero}>
//           <View style={{ flex: 1 }}>
//             <Text style={styles.heroTitle}>
//               {profile?.businessName || profile?.name || "Collector"}
//             </Text>
//             <Text style={styles.heroText}>
//               {profile?.status === "active"
//                 ? availableForPickups
//                   ? "Active and accepting pickups"
//                   : "Active · currently unavailable"
//                 : "Waiting for administrator approval"}
//             </Text>
//           </View>
//           <View
//             style={[
//               styles.statusDot,
//               { backgroundColor: profile?.status === "active" ? C.green : "#f0ad35" },
//             ]}
//           />
//         </View>

//         <View style={styles.mainTabs}>
//           <DashboardTab
//             icon="grid-outline"
//             label="Overview"
//             active={tab === "overview"}
//             onPress={() => setTab("overview")}
//           />
//           <DashboardTab
//             icon="cube-outline"
//             label="Pickups"
//             badge={newRequests.length}
//             active={tab === "jobs"}
//             onPress={() => setTab("jobs")}
//           />
//           <DashboardTab
//             icon="business-outline"
//             label="Profile"
//             active={tab === "profile"}
//             onPress={() => setTab("profile")}
//           />
//         </View>

//         {profile?.status !== "active" && (
//           <Card>
//             <Text style={s.whiteTitle}>Approval pending</Text>
//             <Text style={[styles.cardMuted, { marginTop: 5 }]}>
//               Complete and save your business details, materials and GPS location.
//               An administrator must approve your account before you can accept pickups.
//             </Text>
//           </Card>
//         )}

//         {tab === "overview" && (
//           <>
//             <View style={styles.statsRow}>
//               <Stat value={newRequests.length} label="New requests" icon="notifications-outline" />
//               <Stat value={activeJobs.length} label="Active jobs" icon="navigate-outline" />
//             </View>
//             <View style={styles.statsRow}>
//               <Stat value={`${recycledKg.toFixed(1)} kg`} label="Collected" icon="leaf-outline" />
//               <Stat value={`₹${earnings.toFixed(0)}`} label="Earnings" icon="wallet-outline" />
//             </View>

//             <Text style={s.section}>Quick actions</Text>
//             <Card>
//               <QuickAction
//                 icon="notifications-outline"
//                 title="Review pickup requests"
//                 subtitle={`${newRequests.length} request${newRequests.length === 1 ? "" : "s"} available`}
//                 onPress={() => {
//                   setJobFilter("requests");
//                   setTab("jobs");
//                 }}
//               />
//               <QuickAction
//                 icon="navigate-outline"
//                 title="Continue active pickups"
//                 subtitle={`${activeJobs.length} pickup${activeJobs.length === 1 ? "" : "s"} in progress`}
//                 onPress={() => {
//                   setJobFilter("active");
//                   setTab("jobs");
//                 }}
//               />
//               <QuickAction
//                 icon="location-outline"
//                 title="Update service location"
//                 subtitle={collectorLocation ? "GPS location is saved" : "GPS location required"}
//                 onPress={() => setTab("profile")}
//                 last
//               />
//             </Card>

//             <Text style={s.section}>Recent completed pickups</Text>
//             {!completedJobs.length ? (
//               <Empty text="No completed pickups yet." />
//             ) : (
//               completedJobs.slice(0, 3).map((pickup) => (
//                 <PickupSummary key={pickup.id} pickup={pickup} />
//               ))
//             )}
//           </>
//         )}

//         {tab === "jobs" && (
//           <>
//             <View style={styles.filterTabs}>
//               {[
//                 ["requests", `Requests (${newRequests.length})`],
//                 ["active", `Active (${activeJobs.length})`],
//                 ["completed", `Done (${completedJobs.length})`],
//                 ["responses", `Responses (${responseHistory.length})`],
//               ].map(([id, label]) => (
//                 <TouchableOpacity
//                   key={id}
//                   onPress={() => setJobFilter(id)}
//                   style={[styles.filterButton, jobFilter === id && styles.filterButtonActive]}
//                 >
//                   <Text
//                     style={[
//                       styles.filterText,
//                       jobFilter === id && { color: C.bg },
//                     ]}
//                   >
//                     {label}
//                   </Text>
//                 </TouchableOpacity>
//               ))}
//             </View>

//             {jobFilter === "requests" && (
//               <>
//                 <Text style={s.section}>New pickup requests</Text>
//                 {profile?.status !== "active" ? (
//                   <Empty text="Admin approval is required before requests can be accepted." />
//                 ) : !newRequests.length ? (
//                   <Empty text="No new requests in your service area." />
//                 ) : (
//                   newRequests.map((pickup) => (
//                     <RequestCard
//                       key={pickup.id}
//                       pickup={pickup}
//                       busy={busy}
//                       accept={() => acceptRequest(pickup)}
//                       decline={() => confirmDecline(pickup)}
//                       directions={() => openDirections(pickup)}
//                     />
//                   ))
//                 )}
//               </>
//             )}

//             {jobFilter === "active" && (
//               <>
//                 <Text style={s.section}>Active pickups</Text>
//                 {!activeJobs.length ? (
//                   <Empty text="No pickups currently in progress." />
//                 ) : (
//                   activeJobs.map((pickup) => (
//                     <ActivePickupCard
//                       key={pickup.id}
//                       pickup={pickup}
//                       busy={busy}
//                       weights={weights}
//                       setWeights={setWeights}
//                       verifiedMaterials={verifiedMaterials}
//                       setVerifiedMaterials={setVerifiedMaterials}
//                       notes={notes}
//                       setNotes={setNotes}
//                       start={() => changeStatus(pickup.id, "on_the_way")}
//                       arrive={() => changeStatus(pickup.id, "arrived")}
//                       finish={() => finishPickup(pickup)}
//                       directions={() => openDirections(pickup)}
//                     />
//                   ))
//                 )}
//               </>
//             )}

//             {jobFilter === "completed" && (
//               <>
//                 <Text style={s.section}>Completed pickups</Text>
//                 {!completedJobs.length ? (
//                   <Empty text="No completed pickups yet." />
//                 ) : (
//                   completedJobs.map((pickup) => (
//                     <PickupSummary key={pickup.id} pickup={pickup} />
//                   ))
//                 )}
//               </>
//             )}

//             {jobFilter === "responses" && (
//               <>
//                 <Text style={s.section}>Responses sent to givers</Text>
//                 {!responseHistory.length ? (
//                   <Empty text="Accepted and declined responses will appear here." />
//                 ) : (
//                   responseHistory.map((pickup) => (
//                     <CollectorResponseCard key={pickup.id} pickup={pickup} />
//                   ))
//                 )}
//               </>
//             )}
//           </>
//         )}

//         {tab === "profile" && (
//           <>
//             <Text style={s.section}>Availability</Text>
//             <TouchableOpacity
//               onPress={() => setAvailableForPickups((value) => !value)}
//               style={[
//                 styles.availability,
//                 availableForPickups && styles.availabilityOn,
//               ]}
//             >
//               <Ionicons
//                 name={availableForPickups ? "radio-button-on" : "pause-circle-outline"}
//                 size={25}
//                 color={availableForPickups ? C.green : C.muted}
//               />
//               <View style={{ flex: 1, marginLeft: 10 }}>
//                 <Text style={styles.availabilityTitle}>
//                   {availableForPickups ? "Accepting new pickups" : "Not accepting pickups"}
//                 </Text>
//                 <Text style={styles.availabilityText}>
//                   Save below to publish this availability.
//                 </Text>
//               </View>
//             </TouchableOpacity>

//             <Text style={s.section}>Collector details</Text>
//             <Card>
//               <Label>Business or collector name</Label>
//               <Input value={businessName} onChangeText={setBusinessName} placeholder="Green Earth Recyclers" />
//               <Label>Owner name</Label>
//               <Input value={ownerName} onChangeText={setOwnerName} placeholder="Owner full name" />
//               <Label>Phone</Label>
//               <Input value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+91 98765 43210" />
//               <Label>Address</Label>
//               <Input value={addressLine} onChangeText={setAddressLine} placeholder="Street and area" />
//               <Label>City</Label>
//               <Input value={city} onChangeText={setCity} placeholder="Ludhiana" />
//               <Label>State</Label>
//               <Input value={state} onChangeText={setState} />
//               <Label>Postal code</Label>
//               <Input value={postalCode} onChangeText={setPostalCode} keyboardType="number-pad" placeholder="141001" />
//               <Label>Service radius (km)</Label>
//               <Input value={serviceRadiusKm} onChangeText={setServiceRadiusKm} keyboardType="decimal-pad" />
//             </Card>

//             <Text style={s.section}>Accepted materials</Text>
//             <Card>
//               <View style={styles.materialGrid}>
//                 {MATERIALS.map(([id, label]) => {
//                   const selected = acceptedMaterials.includes(id);
//                   return (
//                     <TouchableOpacity
//                       key={id}
//                       onPress={() => toggleMaterial(id)}
//                       style={[styles.materialChip, selected && styles.materialChipOn]}
//                     >
//                       <Ionicons
//                         name={selected ? "checkmark-circle" : "ellipse-outline"}
//                         size={16}
//                         color={selected ? "#167340" : "#78918b"}
//                       />
//                       <Text style={[styles.materialText, selected && { color: "#167340" }]}>
//                         {label}
//                       </Text>
//                     </TouchableOpacity>
//                   );
//                 })}
//               </View>
//             </Card>

//             <Text style={s.section}>Service GPS location</Text>
//             <Card>
//               <Btn
//                 outline
//                 disabled={gettingLocation}
//                 title={
//                   gettingLocation
//                     ? "Getting location…"
//                     : collectorLocation
//                     ? "Update GPS Location"
//                     : "Use Current GPS Location"
//                 }
//                 onPress={captureLocation}
//               />
//               {collectorLocation && (
//                 <View style={styles.gpsBox}>
//                   <Ionicons name="location" size={20} color="#17643d" />
//                   <View style={{ marginLeft: 8 }}>
//                     <Text style={styles.gpsTitle}>GPS selected</Text>
//                     <Text style={styles.gpsText}>
//                       {Number(collectorLocation.latitude).toFixed(6)},{" "}
//                       {Number(collectorLocation.longitude).toFixed(6)}
//                     </Text>
//                   </View>
//                 </View>
//               )}
//               <View style={{ marginTop: 12 }}>
//                 <Btn
//                   disabled={saving}
//                   title={saving ? "Saving…" : "Save Collector Profile"}
//                   onPress={saveProfile}
//                 />
//               </View>
//             </Card>
//           </>
//         )}

//         <View style={{ marginTop: 22 }}>
//           <Btn outline title="Logout" onPress={logout} />
//         </View>
//       </ScrollView>
//     </KeyboardAvoidingView>
//   );
// }

// function RequestCard({ pickup, busy, accept, decline, directions }) {
//   return (
//     <Card>
//       <View style={s.between}>
//         <View style={{ flex: 1, paddingRight: 8 }}>
//           <Text style={s.whiteTitle}>{formatMaterial(pickup.materialId)}</Text>
//           <Text style={styles.cardMuted}>
//             {formatQuantity(pickup)} · Est. ₹{Number(pickup.estimatedValue || 0).toFixed(0)}
//           </Text>
//         </View>
//         <Pill text={pickup.status === "requested" ? "DIRECT REQUEST" : "OPEN"} solid />
//       </View>
//       <PickupDetails pickup={pickup} />
//       <View style={styles.actionRow}>
//         <View style={{ flex: 1, marginRight: 5 }}>
//           <Btn
//             disabled={busy === `decline-${pickup.id}` || !!busy}
//             outline
//             title={busy === `decline-${pickup.id}` ? "Declining…" : "Decline"}
//             onPress={decline}
//           />
//         </View>
//         <View style={{ flex: 1, marginLeft: 5 }}>
//           <Btn
//             disabled={busy === `accept-${pickup.id}` || !!busy}
//             title={busy === `accept-${pickup.id}` ? "Accepting…" : "Accept"}
//             onPress={accept}
//           />
//         </View>
//       </View>
//       <TouchableOpacity onPress={directions} style={styles.mapLink}>
//         <Ionicons name="navigate-outline" size={16} color="#16874a" />
//         <Text style={styles.mapText}>Preview pickup directions</Text>
//       </TouchableOpacity>
//     </Card>
//   );
// }

// function ActivePickupCard({
//   pickup,
//   busy,
//   weights,
//   setWeights,
//   verifiedMaterials,
//   setVerifiedMaterials,
//   notes,
//   setNotes,
//   start,
//   arrive,
//   finish,
//   directions,
// }) {
//   const actionBusy = busy?.endsWith(pickup.id);
//   return (
//     <Card>
//       <View style={s.between}>
//         <View style={{ flex: 1 }}>
//           <Text style={s.whiteTitle}>{formatMaterial(pickup.materialId)}</Text>
//           <Text style={styles.cardMuted}>{formatQuantity(pickup)}</Text>
//         </View>
//         <Pill text={String(pickup.status).replace(/_/g, " ").toUpperCase()} solid />
//       </View>
//       <PickupDetails pickup={pickup} />
//       <TouchableOpacity onPress={directions} style={styles.mapLink}>
//         <Ionicons name="navigate" size={16} color="#16874a" />
//         <Text style={styles.mapText}>Open directions in Google Maps</Text>
//       </TouchableOpacity>

//       <View style={{ marginTop: 12 }}>
//         {pickup.status === "accepted" && (
//           <Btn disabled={actionBusy} title="Start Trip" onPress={start} />
//         )}
//         {pickup.status === "on_the_way" && (
//           <Btn disabled={actionBusy} title="Mark Arrived" onPress={arrive} />
//         )}
//         {pickup.status === "arrived" && (
//           <>
//             <Text style={styles.verifyTitle}>Collector verification</Text>
//             <Label>Verified material ID</Label>
//             <Input
//               value={verifiedMaterials[pickup.id] ?? pickup.materialId ?? ""}
//               onChangeText={(value) =>
//                 setVerifiedMaterials((current) => ({ ...current, [pickup.id]: value }))
//               }
//               autoCapitalize="none"
//               placeholder="plastic_pet"
//             />
//             <Label>Verified weight in kg</Label>
//             <Input
//               value={weights[pickup.id] || ""}
//               onChangeText={(value) =>
//                 setWeights((current) => ({ ...current, [pickup.id]: value }))
//               }
//               keyboardType="decimal-pad"
//               placeholder="0.00"
//             />
//             <Label>Quality or settlement notes (optional)</Label>
//             <Input
//               value={notes[pickup.id] || ""}
//               onChangeText={(value) =>
//                 setNotes((current) => ({ ...current, [pickup.id]: value }))
//               }
//               placeholder="Clean, dry, sorted…"
//             />
//             <Text style={styles.settlementText}>
//               Settlement uses the saved rate of ₹{Number(pickup.ratePerKg || 0).toFixed(2)}/kg.
//             </Text>
//             <Btn disabled={actionBusy} title="Verify & Complete Pickup" onPress={finish} />
//           </>
//         )}
//       </View>
//     </Card>
//   );
// }

// function CollectorResponseCard({ pickup }) {
//   const declined = pickup.collectorResponse === "declined";
//   const responseStatus = declined ? "DECLINED" : String(pickup.status || "accepted").replace(/_/g, " ").toUpperCase();
//   return (
//     <Card style={declined ? styles.declinedResponseCard : styles.acceptedResponseCard}>
//       <View style={s.between}>
//         <View style={{ flex: 1, paddingRight: 8 }}>
//           <Text style={s.whiteTitle}>{formatMaterial(pickup.materialId)}</Text>
//           <Text style={styles.cardMuted}>{formatQuantity(pickup)}</Text>
//         </View>
//         <Pill text={responseStatus} solid={!declined} />
//       </View>
//       <View style={styles.responseMessage}>
//         <Ionicons
//           name={declined ? "close-circle-outline" : "checkmark-circle-outline"}
//           size={18}
//           color={declined ? "#a45c38" : "#16874a"}
//         />
//         <Text style={styles.responseMessageText}>
//           {declined
//             ? "Decline response sent. The request is open for other collectors."
//             : pickup.status === "completed"
//             ? "Accepted response sent and pickup completed."
//             : "Accepted response sent to the giver. This pickup is visible in Active."}
//         </Text>
//       </View>
//       <Text style={[styles.cardMuted, { marginTop: 8 }]}>Updated {formatDate(pickup.updatedAt || pickup.createdAt)}</Text>
//     </Card>
//   );
// }

// function PickupDetails({ pickup }) {
//   const address = formatAddress(pickup.address);
//   return (
//     <View style={styles.detailsBox}>
//       {!!pickup.giverName && (
//         <Detail icon="person-outline" text={`Giver: ${pickup.giverName}`} />
//       )}
//       {!!pickup.giverPhone && (
//         <Detail icon="call-outline" text={`Phone: ${pickup.giverPhone}`} />
//       )}
//       <Detail icon="pricetag-outline" text={`Rate: ₹${Number(pickup.ratePerKg || 0).toFixed(2)}/kg`} />
//       {!!address && <Detail icon="location-outline" text={address} />}
//       <Detail icon="time-outline" text={`Requested ${formatDate(pickup.createdAt)}`} />
//     </View>
//   );
// }

// function PickupSummary({ pickup }) {
//   return (
//     <Card>
//       <View style={s.between}>
//         <View style={{ flex: 1 }}>
//           <Text style={s.whiteTitle}>
//             {formatMaterial(pickup.verifiedMaterialId || pickup.materialId)}
//           </Text>
//           <Text style={styles.cardMuted}>
//             {Number(pickup.finalKg || pickup.estimatedKg || 0).toFixed(2)} kg · ₹
//             {Number(pickup.finalAmount || pickup.estimatedValue || 0).toFixed(0)}
//           </Text>
//         </View>
//         <Pill text="COMPLETED" solid />
//       </View>
//       <Text style={[styles.cardMuted, { marginTop: 8 }]}>
//         {formatDate(pickup.completedAt || pickup.updatedAt)}
//       </Text>
//     </Card>
//   );
// }

// function DashboardTab({ icon, label, active, badge, onPress }) {
//   return (
//     <TouchableOpacity onPress={onPress} style={[styles.mainTab, active && styles.mainTabOn]}>
//       <View>
//         <Ionicons name={icon} size={20} color={active ? C.bg : C.muted} />
//         {!!badge && (
//           <View style={styles.badge}>
//             <Text style={styles.badgeText}>{badge > 9 ? "9+" : badge}</Text>
//           </View>
//         )}
//       </View>
//       <Text style={[styles.mainTabText, active && { color: C.bg }]}>{label}</Text>
//     </TouchableOpacity>
//   );
// }

// function Stat({ value, label, icon }) {
//   return (
//     <View style={styles.stat}>
//       <Ionicons name={icon} size={19} color={C.green} />
//       <Text style={styles.statValue}>{value}</Text>
//       <Text style={styles.statLabel}>{label}</Text>
//     </View>
//   );
// }

// function QuickAction({ icon, title, subtitle, onPress, last }) {
//   return (
//     <TouchableOpacity onPress={onPress} style={[styles.quickAction, last && { borderBottomWidth: 0 }]}>
//       <View style={styles.quickIcon}>
//         <Ionicons name={icon} size={20} color="#16874a" />
//       </View>
//       <View style={{ flex: 1 }}>
//         <Text style={styles.quickTitle}>{title}</Text>
//         <Text style={styles.quickText}>{subtitle}</Text>
//       </View>
//       <Ionicons name="chevron-forward" size={18} color="#78918b" />
//     </TouchableOpacity>
//   );
// }

// function Detail({ icon, text }) {
//   return (
//     <View style={styles.detailRow}>
//       <Ionicons name={icon} size={14} color="#5e7c74" />
//       <Text style={styles.detailText}>{text}</Text>
//     </View>
//   );
// }

// function Empty({ text }) {
//   return (
//     <View style={styles.empty}>
//       <Ionicons name="file-tray-outline" size={29} color={C.green} />
//       <Text style={[s.small, { marginTop: 7, textAlign: "center" }]}>{text}</Text>
//     </View>
//   );
// }

// function Input(props) {
//   return (
//     <TextInput
//       {...props}
//       placeholderTextColor="#849c95"
//       style={[styles.input, props.style]}
//     />
//   );
// }

// function Label({ children }) {
//   return <Text style={styles.label}>{children}</Text>;
// }

// function formatMaterial(id) {
//   const match = MATERIALS.find(([materialId]) => materialId === id);
//   return match?.[1] || String(id || "Recyclable material").replace(/_/g, " ");
// }

// function formatQuantity(pickup) {
//   if (pickup.originalQuantity && pickup.originalUnit) {
//     return `${pickup.originalQuantity} ${pickup.originalUnit} (≈ ${Number(
//       pickup.estimatedKg || 0
//     ).toFixed(2)} kg)`;
//   }
//   return `${Number(pickup.estimatedKg || 0).toFixed(2)} kg`;
// }

// function formatAddress(address) {
//   if (!address) return "";
//   if (typeof address === "string") return address;
//   return [address.addressLine, address.line1, address.city, address.state, address.postalCode]
//     .filter(Boolean)
//     .join(", ");
// }

// function formatDate(value) {
//   const date = value?.toDate?.() || (value ? new Date(value) : null);
//   if (!date || Number.isNaN(date.getTime())) return "recently";
//   return date.toLocaleString("en-IN", {
//     day: "2-digit",
//     month: "short",
//     hour: "2-digit",
//     minute: "2-digit",
//   });
// }

// const styles = {
//   notificationButton: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "rgba(32,211,90,.10)",
//   },
//   notificationBadge: {
//     position: "absolute",
//     right: -5,
//     top: -5,
//     minWidth: 17,
//     height: 17,
//     borderRadius: 9,
//     alignItems: "center",
//     justifyContent: "center",
//     paddingHorizontal: 3,
//     backgroundColor: C.red,
//   },
//   notificationBadgeText: { color: "#fff", fontSize: 7, fontWeight: "900" },
//   hero: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: C.panel,
//     borderWidth: 1,
//     borderColor: C.line,
//     borderRadius: 15,
//     padding: 16,
//     marginTop: 8,
//   },
//   heroTitle: { color: C.text, fontSize: 18, fontWeight: "900" },
//   heroText: { color: C.muted, fontSize: 11, marginTop: 4 },
//   statusDot: { width: 13, height: 13, borderRadius: 7, marginLeft: 10 },
//   mainTabs: {
//     flexDirection: "row",
//     backgroundColor: C.panel,
//     borderRadius: 13,
//     padding: 4,
//     marginVertical: 16,
//     borderWidth: 1,
//     borderColor: C.line,
//   },
//   mainTab: {
//     flex: 1,
//     minHeight: 54,
//     borderRadius: 9,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   mainTabOn: { backgroundColor: C.green },
//   mainTabText: { color: C.muted, fontSize: 10, fontWeight: "700", marginTop: 2 },
//   badge: {
//     position: "absolute",
//     right: -11,
//     top: -7,
//     minWidth: 17,
//     height: 17,
//     borderRadius: 9,
//     backgroundColor: C.red,
//     alignItems: "center",
//     justifyContent: "center",
//     paddingHorizontal: 3,
//   },
//   badgeText: { color: "#fff", fontSize: 8, fontWeight: "900" },
//   statsRow: { flexDirection: "row", marginHorizontal: -4, marginBottom: 8 },
//   stat: {
//     flex: 1,
//     marginHorizontal: 4,
//     backgroundColor: C.panel2,
//     borderRadius: 13,
//     padding: 14,
//     alignItems: "center",
//     borderWidth: 1,
//     borderColor: C.line,
//   },
//   statValue: { color: C.text, fontSize: 18, fontWeight: "900", marginTop: 5 },
//   statLabel: { color: C.muted, fontSize: 9, marginTop: 2 },
//   cardMuted: { color: "#58766f", fontSize: 11 },
//   quickAction: {
//     minHeight: 62,
//     flexDirection: "row",
//     alignItems: "center",
//     borderBottomWidth: 1,
//     borderBottomColor: "#dfe9e7",
//   },
//   quickIcon: {
//     width: 38,
//     height: 38,
//     borderRadius: 10,
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "#ddf8e6",
//     marginRight: 10,
//   },
//   quickTitle: { color: "#173a31", fontSize: 12, fontWeight: "800" },
//   quickText: { color: "#6a857e", fontSize: 10, marginTop: 2 },
//   filterTabs: {
//     flexDirection: "row",
//     backgroundColor: C.panel,
//     borderRadius: 11,
//     padding: 3,
//   },
//   filterButton: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8 },
//   filterButtonActive: { backgroundColor: C.green },
//   filterText: { color: C.muted, fontSize: 9, fontWeight: "800" },
//   actionRow: { flexDirection: "row", marginTop: 13 },
//   mapLink: {
//     minHeight: 38,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     marginTop: 8,
//   },
//   mapText: { color: "#16874a", fontSize: 11, fontWeight: "700", marginLeft: 5 },
//   acceptedResponseCard: { borderWidth: 1, borderColor: C.green },
//   declinedResponseCard: { borderWidth: 1, borderColor: "#d7a27d" },
//   responseMessage: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginTop: 11,
//     padding: 9,
//     borderRadius: 8,
//     backgroundColor: "#eef8f2",
//   },
//   responseMessageText: {
//     flex: 1,
//     color: "#54736c",
//     fontSize: 9,
//     lineHeight: 14,
//     marginLeft: 7,
//   },
//   detailsBox: {
//     marginTop: 11,
//     paddingTop: 9,
//     borderTopWidth: 1,
//     borderTopColor: "#dfe9e7",
//   },
//   detailRow: { flexDirection: "row", alignItems: "center", marginTop: 5 },
//   detailText: { flex: 1, color: "#5e7c74", fontSize: 10, marginLeft: 6 },
//   verifyTitle: {
//     color: "#173a31",
//     fontSize: 14,
//     fontWeight: "900",
//     marginBottom: 12,
//     paddingTop: 12,
//     borderTopWidth: 1,
//     borderTopColor: "#dfe9e7",
//   },
//   settlementText: {
//     color: "#54736c",
//     backgroundColor: "#edf7f1",
//     padding: 9,
//     borderRadius: 8,
//     fontSize: 10,
//     marginBottom: 11,
//   },
//   availability: {
//     flexDirection: "row",
//     alignItems: "center",
//     padding: 15,
//     borderRadius: 13,
//     backgroundColor: C.panel,
//     borderWidth: 1,
//     borderColor: C.line,
//   },
//   availabilityOn: { borderColor: C.green },
//   availabilityTitle: { color: C.text, fontSize: 13, fontWeight: "800" },
//   availabilityText: { color: C.muted, fontSize: 9, marginTop: 3 },
//   input: {
//     height: 48,
//     color: "#173a31",
//     borderWidth: 1,
//     borderColor: "#d4e3de",
//     borderRadius: 9,
//     paddingHorizontal: 12,
//     marginBottom: 12,
//     backgroundColor: "#fff",
//   },
//   label: { color: "#42695d", fontSize: 11, fontWeight: "700", marginBottom: 6 },
//   materialGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -3 },
//   materialChip: {
//     flexDirection: "row",
//     alignItems: "center",
//     borderWidth: 1,
//     borderColor: "#d7e4e0",
//     borderRadius: 9,
//     paddingHorizontal: 9,
//     paddingVertical: 8,
//     margin: 3,
//   },
//   materialChipOn: { borderColor: C.green, backgroundColor: "#e4fbea" },
//   materialText: { color: "#6c8580", fontSize: 10, marginLeft: 4 },
//   gpsBox: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#e7fff0",
//     padding: 12,
//     borderRadius: 10,
//     marginTop: 12,
//   },
//   gpsTitle: { color: "#17643d", fontWeight: "700", fontSize: 11 },
//   gpsText: { color: "#42705c", fontSize: 10, marginTop: 2 },
//   empty: {
//     padding: 24,
//     borderRadius: 14,
//     alignItems: "center",
//     backgroundColor: C.panel,
//     borderWidth: 1,
//     borderColor: C.line,
//   },
// };



import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";

import { Btn, Card, Header, Pill } from "../components/UI";
import { saveCollectorDetails } from "../firebase/marketplaceService";
import { C } from "../theme";
import { s } from "../styles";

const MATERIALS = [
  ["plastic_pet", "PET Plastic"],
  ["plastic_hdpe", "HDPE Plastic"],
  ["mixed_plastic", "Mixed Plastic"],
  ["cardboard", "Cardboard"],
  ["paper", "Paper"],
  ["newspaper", "Newspaper"],
  ["glass", "Glass"],
  ["metal_aluminium", "Aluminium"],
  ["metal_steel", "Steel"],
  ["metal_iron", "Iron"],
  ["metal_copper", "Copper"],
  ["ewaste", "E-Waste"],
  ["organic", "Organic"],
  ["textile", "Textile"],
];

const ACTIVE_STATUSES = ["accepted", "on_the_way", "arrived"];

export default function CollectorDashboardScreen({
  user,
  profile = {},
  pickups = [],
  openPickups = [],
  declinedPickups = [],
  transactions = [],
  unreadCount = 0,
  syncError = null,
  go,
  accept,
  decline,
  status,
  complete,
  logout,
}) {
  const safePickups = Array.isArray(pickups) ? pickups.filter(Boolean) : [];
  const safeOpen = Array.isArray(openPickups) ? openPickups.filter(Boolean) : [];
  const safeDeclined = Array.isArray(declinedPickups)
    ? declinedPickups.filter(Boolean)
    : [];
  const safeTransactions = Array.isArray(transactions)
    ? transactions.filter(Boolean)
    : [];

  const [tab, setTab] = useState("overview");
  const [jobTab, setJobTab] = useState("requests");
  const [busy, setBusy] = useState(null);
  const [weights, setWeights] = useState({});
  const [verifiedMaterials, setVerifiedMaterials] = useState({});
  const [notes, setNotes] = useState({});

  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("Punjab");
  const [postalCode, setPostalCode] = useState("");
  const [serviceRadiusKm, setServiceRadiusKm] = useState("10");
  const [acceptedMaterials, setAcceptedMaterials] = useState(
    MATERIALS.map(([id]) => id)
  );
  const [availableForPickups, setAvailableForPickups] = useState(true);
  const [collectorLocation, setCollectorLocation] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    setBusinessName(String(profile?.businessName || ""));
    setOwnerName(String(profile?.ownerName || profile?.name || ""));
    setPhone(String(profile?.phone || ""));
    setAddressLine(String(profile?.addressLine || ""));
    setCity(String(profile?.city || ""));
    setStateName(String(profile?.state || "Punjab"));
    setPostalCode(String(profile?.postalCode || ""));
    setServiceRadiusKm(String(profile?.serviceRadiusKm || 10));
    setAcceptedMaterials(
      Array.isArray(profile?.acceptedMaterials) && profile.acceptedMaterials.length
        ? profile.acceptedMaterials
        : MATERIALS.map(([id]) => id)
    );
    setAvailableForPickups(profile?.availableForPickups !== false);

    const latitude = Number(profile?.location?.latitude);
    const longitude = Number(profile?.location?.longitude);
    setCollectorLocation(
      Number.isFinite(latitude) && Number.isFinite(longitude)
        ? { ...profile.location, latitude, longitude }
        : null
    );
  }, [profile]);

  const declinedIds = useMemo(() => {
    const ids = new Set(safeDeclined.map((item) => item.id).filter(Boolean));
    safeOpen.forEach((item) => {
      const list = Array.isArray(item.declinedCollectorIds)
        ? item.declinedCollectorIds
        : [];
      if (list.includes(user?.uid) && item.id) ids.add(item.id);
    });
    return ids;
  }, [safeDeclined, safeOpen, user?.uid]);

  const requests = useMemo(() => {
    const merged = [
      ...safePickups.filter((item) => item.status === "requested"),
      ...safeOpen.filter((item) => {
        const declined = Array.isArray(item.declinedCollectorIds)
          ? item.declinedCollectorIds
          : [];
        return !declined.includes(user?.uid);
      }),
    ];
    return uniqueById(merged);
  }, [safePickups, safeOpen, user?.uid]);

  const activeJobs = safePickups.filter((item) =>
    ACTIVE_STATUSES.includes(item.status)
  );
  const completedJobs = safePickups.filter(
    (item) => item.status === "completed"
  );
  const declinedJobs = uniqueById([
    ...safeDeclined,
    ...safeOpen.filter((item) => declinedIds.has(item.id)),
  ]);

  const earnings = safeTransactions.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );
  const collectedKg = safeTransactions.reduce(
    (sum, item) => sum + Number(item.weightKg || 0),
    0
  );

  const runAction = async (key, callback, success) => {
    if (typeof callback !== "function") {
      return Alert.alert("Action unavailable", "This collector action is not connected.");
    }
    try {
      setBusy(key);
      await callback();
      if (success) Alert.alert("Updated", success);
      return true;
    } catch (error) {
      Alert.alert("Action failed", error?.message || "Please try again.");
      return false;
    } finally {
      setBusy(null);
    }
  };

  const acceptPickup = async (pickup) => {
    const success = await runAction(
      `accept-${pickup.id}`,
      () => accept?.(pickup.id),
      "Pickup accepted. It is now available in Active Jobs."
    );
    if (success) {
      setTab("jobs");
      setJobTab("active");
    }
  };

  const declinePickup = (pickup) => {
    Alert.alert(
      "Decline pickup?",
      "The request will be released to other approved collectors.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Decline",
          style: "destructive",
          onPress: () =>
            runAction(
              `decline-${pickup.id}`,
              () => decline?.(pickup.id, "Collector unavailable"),
              "The pickup was declined and released."
            ),
        },
      ]
    );
  };

  const updatePickupStatus = (pickup, nextStatus) =>
    runAction(
      `status-${pickup.id}`,
      () => status?.(pickup.id, nextStatus),
      nextStatus === "on_the_way"
        ? "The giver can now see that you are on the way."
        : "The pickup was marked as arrived."
    );

  const finishPickup = (pickup) => {
    const finalKg = Number(weights[pickup.id]);
    const verifiedMaterialId = String(
      verifiedMaterials[pickup.id] || pickup.materialId || ""
    ).trim();

    if (!Number.isFinite(finalKg) || finalKg <= 0) {
      return Alert.alert("Weight required", "Enter the verified weight in kilograms.");
    }
    if (!verifiedMaterialId) {
      return Alert.alert("Material required", "Enter the verified material ID.");
    }

    Alert.alert(
      "Complete pickup?",
      `Confirm ${finalKg.toFixed(2)} kg of ${materialName(verifiedMaterialId)}.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Complete",
          onPress: async () => {
            const success = await runAction(
              `complete-${pickup.id}`,
              () =>
                complete?.(pickup.id, {
                  finalKg,
                  verifiedMaterialId,
                  collectorNotes: notes[pickup.id] || "",
                }),
              "Pickup completed and settlement recorded."
            );
            if (success) {
              setWeights((current) => ({ ...current, [pickup.id]: "" }));
              setNotes((current) => ({ ...current, [pickup.id]: "" }));
            }
          },
        },
      ]
    );
  };

  const captureLocation = async () => {
    try {
      setGettingLocation(true);
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        return Alert.alert(
          "Location permission required",
          "Allow location access so nearby givers can discover your collection service."
        );
      }
      const result = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setCollectorLocation({
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
        accuracy: result.coords.accuracy || null,
      });
      Alert.alert("Location captured", "Save the collector profile to publish it.");
    } catch (error) {
      Alert.alert("Location failed", error?.message || "Unable to read GPS location.");
    } finally {
      setGettingLocation(false);
    }
  };

  const saveProfile = async () => {
    if (!user?.uid) return Alert.alert("Account unavailable", "Please log in again.");
    if (
      !businessName.trim() ||
      !ownerName.trim() ||
      !phone.trim() ||
      !addressLine.trim() ||
      !city.trim() ||
      !postalCode.trim()
    ) {
      return Alert.alert("Incomplete details", "Complete every required collector field.");
    }
    if (!collectorLocation) {
      return Alert.alert("GPS required", "Capture your current service location.");
    }
    if (!acceptedMaterials.length) {
      return Alert.alert("Materials required", "Select at least one accepted material.");
    }
    const radius = Number(serviceRadiusKm);
    if (!Number.isFinite(radius) || radius <= 0) {
      return Alert.alert("Invalid radius", "Enter a service radius greater than zero.");
    }

    try {
      setSavingProfile(true);
      await saveCollectorDetails(user.uid, {
        businessName,
        ownerName,
        phone,
        addressLine,
        city,
        state: stateName,
        postalCode,
        serviceRadiusKm: radius,
        acceptedMaterials,
        availableForPickups,
        location: collectorLocation,
      });
      Alert.alert("Profile saved", "Your collector details and availability are updated.");
    } catch (error) {
      Alert.alert("Save failed", error?.message || "Unable to save collector details.");
    } finally {
      setSavingProfile(false);
    }
  };

  const toggleMaterial = (id) => {
    setAcceptedMaterials((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  return (
    <KeyboardAvoidingView
      style={s.fill}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={s.page}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Header
          title="Collector Dashboard"
          right={
            <TouchableOpacity
              onPress={() => go?.("notifications")}
              style={styles.notificationButton}
            >
              <Ionicons name="notifications-outline" size={21} color={C.green} />
              {!!unreadCount && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          }
        />

        {!!syncError && (
          <View style={styles.errorBanner}>
            <Ionicons name="cloud-offline-outline" size={19} color={C.red} />
            <Text style={styles.errorText}>{syncError}</Text>
          </View>
        )}

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="business-outline" size={27} color={C.green} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroEyebrow}>COLLECTOR ACCOUNT</Text>
            <Text style={styles.heroTitle}>
              {profile?.businessName || profile?.name || "Collector"}
            </Text>
            <Text style={styles.heroText}>
              {profile?.status === "active"
                ? availableForPickups
                  ? "Approved · accepting pickup requests"
                  : "Approved · currently unavailable"
                : "Waiting for administrator approval"}
            </Text>
          </View>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  profile?.status === "active" && availableForPickups
                    ? C.green
                    : "#e9a82d",
              },
            ]}
          />
        </View>

        <View style={styles.tabs}>
          <Tab icon="grid-outline" label="Overview" active={tab === "overview"} onPress={() => setTab("overview")} />
          <Tab icon="cube-outline" label="Jobs" badge={requests.length} active={tab === "jobs"} onPress={() => setTab("jobs")} />
          <Tab icon="person-outline" label="Profile" active={tab === "profile"} onPress={() => setTab("profile")} />
        </View>

        {profile?.status !== "active" && (
          <View style={styles.pendingBanner}>
            <Ionicons name="time-outline" size={21} color="#b47c16" />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.pendingTitle}>Administrator approval pending</Text>
              <Text style={styles.pendingText}>
                Complete your profile and GPS location while your account is reviewed.
              </Text>
            </View>
          </View>
        )}

        {tab === "overview" && (
          <Overview
            requests={requests}
            activeJobs={activeJobs}
            completedJobs={completedJobs}
            earnings={earnings}
            collectedKg={collectedKg}
            collectorLocation={collectorLocation}
            openJobs={() => {
              setJobTab("requests");
              setTab("jobs");
            }}
            openActive={() => {
              setJobTab("active");
              setTab("jobs");
            }}
            openProfile={() => setTab("profile")}
          />
        )}

        {tab === "jobs" && (
          <Jobs
            approved={profile?.status === "active"}
            jobTab={jobTab}
            setJobTab={setJobTab}
            requests={requests}
            activeJobs={activeJobs}
            completedJobs={completedJobs}
            declinedJobs={declinedJobs}
            busy={busy}
            acceptPickup={acceptPickup}
            declinePickup={declinePickup}
            updatePickupStatus={updatePickupStatus}
            finishPickup={finishPickup}
            weights={weights}
            setWeights={setWeights}
            verifiedMaterials={verifiedMaterials}
            setVerifiedMaterials={setVerifiedMaterials}
            notes={notes}
            setNotes={setNotes}
          />
        )}

        {tab === "profile" && (
          <ProfileForm
            businessName={businessName}
            setBusinessName={setBusinessName}
            ownerName={ownerName}
            setOwnerName={setOwnerName}
            phone={phone}
            setPhone={setPhone}
            addressLine={addressLine}
            setAddressLine={setAddressLine}
            city={city}
            setCity={setCity}
            stateName={stateName}
            setStateName={setStateName}
            postalCode={postalCode}
            setPostalCode={setPostalCode}
            serviceRadiusKm={serviceRadiusKm}
            setServiceRadiusKm={setServiceRadiusKm}
            acceptedMaterials={acceptedMaterials}
            toggleMaterial={toggleMaterial}
            availableForPickups={availableForPickups}
            setAvailableForPickups={setAvailableForPickups}
            collectorLocation={collectorLocation}
            captureLocation={captureLocation}
            gettingLocation={gettingLocation}
            saveProfile={saveProfile}
            savingProfile={savingProfile}
          />
        )}

        <View style={{ marginTop: 18 }}>
          <Btn outline icon="log-out-outline" title="Logout" onPress={() => logout?.()} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Overview({
  requests,
  activeJobs,
  completedJobs,
  earnings,
  collectedKg,
  collectorLocation,
  openJobs,
  openActive,
  openProfile,
}) {
  return (
    <>
      <View style={styles.statsRow}>
        <Stat icon="notifications-outline" value={requests.length} label="Requests" />
        <Stat icon="navigate-outline" value={activeJobs.length} label="Active" />
        <Stat icon="checkmark-done-outline" value={completedJobs.length} label="Completed" />
      </View>
      <View style={styles.earningsCard}>
        <View>
          <Text style={styles.earningsLabel}>TOTAL VERIFIED EARNINGS</Text>
          <Text style={styles.earningsValue}>₹{earnings.toFixed(0)}</Text>
          <Text style={styles.earningsText}>{collectedKg.toFixed(1)} kg collected</Text>
        </View>
        <View style={styles.walletIcon}>
          <Ionicons name="wallet-outline" size={29} color={C.green} />
        </View>
      </View>

      <Text style={s.section}>Quick Actions</Text>
      <Card>
        <Quick icon="notifications-outline" title="Review pickup requests" text={`${requests.length} available`} onPress={openJobs} />
        <Quick icon="navigate-outline" title="Continue active jobs" text={`${activeJobs.length} in progress`} onPress={openActive} />
        <Quick icon="location-outline" title="Service location" text={collectorLocation ? "GPS saved" : "GPS required"} onPress={openProfile} last />
      </Card>
    </>
  );
}

function Jobs({
  approved,
  jobTab,
  setJobTab,
  requests,
  activeJobs,
  completedJobs,
  declinedJobs,
  busy,
  acceptPickup,
  declinePickup,
  updatePickupStatus,
  finishPickup,
  weights,
  setWeights,
  verifiedMaterials,
  setVerifiedMaterials,
  notes,
  setNotes,
}) {
  const tabs = [
    ["requests", `Requests ${requests.length}`],
    ["active", `Active ${activeJobs.length}`],
    ["completed", `Done ${completedJobs.length}`],
    ["declined", `Declined ${declinedJobs.length}`],
  ];

  const list =
    jobTab === "requests"
      ? requests
      : jobTab === "active"
      ? activeJobs
      : jobTab === "completed"
      ? completedJobs
      : declinedJobs;

  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.jobTabs}>
        {tabs.map(([id, label]) => (
          <TouchableOpacity
            key={id}
            onPress={() => setJobTab(id)}
            style={[styles.jobTab, jobTab === id && styles.jobTabActive]}
          >
            <Text style={[styles.jobTabText, jobTab === id && styles.jobTabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {!approved && jobTab === "requests" ? (
        <Empty text="Administrator approval is required before accepting requests." />
      ) : !list.length ? (
        <Empty text={`No ${jobTab} pickups found.`} />
      ) : (
        list.map((pickup) => (
          <JobCard
            key={pickup.id || `${pickup.materialId}-${pickup.createdAt?.seconds || Math.random()}`}
            pickup={pickup}
            type={jobTab}
            busy={busy}
            accept={() => acceptPickup(pickup)}
            decline={() => declinePickup(pickup)}
            updateStatus={(next) => updatePickupStatus(pickup, next)}
            finish={() => finishPickup(pickup)}
            weight={weights[pickup.id] || ""}
            setWeight={(value) => setWeights((current) => ({ ...current, [pickup.id]: cleanDecimal(value) }))}
            verifiedMaterial={verifiedMaterials[pickup.id] ?? pickup.materialId ?? ""}
            setVerifiedMaterial={(value) => setVerifiedMaterials((current) => ({ ...current, [pickup.id]: value }))}
            note={notes[pickup.id] || ""}
            setNote={(value) => setNotes((current) => ({ ...current, [pickup.id]: value }))}
          />
        ))
      )}
    </>
  );
}

function JobCard({
  pickup,
  type,
  busy,
  accept,
  decline,
  updateStatus,
  finish,
  weight,
  setWeight,
  verifiedMaterial,
  setVerifiedMaterial,
  note,
  setNote,
}) {
  const actionBusy = typeof busy === "string" && busy.includes(String(pickup.id));
  const statusLabel = String(pickup.status || type).replace(/_/g, " ").toUpperCase();

  return (
    <Card style={type === "active" ? styles.activeJob : undefined}>
      <View style={styles.jobHeader}>
        <View style={styles.jobIcon}>
          <Ionicons name="cube-outline" size={22} color="#16874a" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{materialName(pickup.materialId)}</Text>
          <Text style={styles.cardText}>{quantityLabel(pickup)}</Text>
        </View>
        <Pill solid={type === "active" || type === "completed"} text={statusLabel} />
      </View>

      <View style={styles.detailsBox}>
        {!!pickup.giverName && <Detail icon="person-outline" text={pickup.giverName} />}
        {!!pickup.giverPhone && <Detail icon="call-outline" text={pickup.giverPhone} />}
        {!!formatAddress(pickup.address) && <Detail icon="location-outline" text={formatAddress(pickup.address)} />}
        <Detail icon="cash-outline" text={`Estimated ₹${Number(pickup.estimatedValue || 0).toFixed(0)}`} />
      </View>

      {type === "requests" && (
        <View style={styles.actionRow}>
          <View style={{ flex: 1, marginRight: 4 }}>
            <Btn outline disabled={!!busy} title={busy === `decline-${pickup.id}` ? "Declining…" : "Decline"} onPress={decline} />
          </View>
          <View style={{ flex: 1, marginLeft: 4 }}>
            <Btn disabled={!!busy} title={busy === `accept-${pickup.id}` ? "Accepting…" : "Accept"} onPress={accept} />
          </View>
        </View>
      )}

      {type === "active" && pickup.status === "accepted" && (
        <Btn disabled={actionBusy} title="Start Trip" onPress={() => updateStatus("on_the_way")} />
      )}
      {type === "active" && pickup.status === "on_the_way" && (
        <Btn disabled={actionBusy} title="Mark as Arrived" onPress={() => updateStatus("arrived")} />
      )}
      {type === "active" && pickup.status === "arrived" && (
        <View style={styles.verifyBox}>
          <Text style={styles.verifyTitle}>Collector Verification</Text>
          <Field label="Verified material ID">
            <Input value={verifiedMaterial} onChangeText={setVerifiedMaterial} autoCapitalize="none" placeholder="plastic_pet" />
          </Field>
          <Field label="Verified weight in kg">
            <Input value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="0.00" />
          </Field>
          <Field label="Notes (optional)">
            <Input value={note} onChangeText={setNote} placeholder="Clean, dry, sorted…" />
          </Field>
          <Btn disabled={actionBusy} title="Verify & Complete Pickup" onPress={finish} />
        </View>
      )}
    </Card>
  );
}

function ProfileForm(props) {
  const fields = [
    ["Business name", props.businessName, props.setBusinessName, "Green Earth Recyclers"],
    ["Owner name", props.ownerName, props.setOwnerName, "Full name"],
    ["Phone", props.phone, props.setPhone, "+91 98765 43210", "phone-pad"],
    ["Address", props.addressLine, props.setAddressLine, "Street and area"],
    ["City", props.city, props.setCity, "Ludhiana"],
    ["State", props.stateName, props.setStateName, "Punjab"],
    ["Postal code", props.postalCode, props.setPostalCode, "141001", "number-pad"],
    ["Service radius (km)", props.serviceRadiusKm, props.setServiceRadiusKm, "10", "decimal-pad"],
  ];

  return (
    <>
      <Text style={s.section}>Availability</Text>
      <TouchableOpacity
        onPress={() => props.setAvailableForPickups((value) => !value)}
        style={[styles.availability, props.availableForPickups && styles.availabilityOn]}
      >
        <Ionicons
          name={props.availableForPickups ? "radio-button-on" : "pause-circle-outline"}
          size={25}
          color={props.availableForPickups ? C.green : C.muted}
        />
        <View style={{ flex: 1, marginLeft: 9 }}>
          <Text style={styles.availabilityTitle}>
            {props.availableForPickups ? "Accepting pickup requests" : "Currently unavailable"}
          </Text>
          <Text style={styles.availabilityText}>Save below to publish this status.</Text>
        </View>
      </TouchableOpacity>

      <Text style={s.section}>Business Details</Text>
      <Card>
        {fields.map(([label, value, setter, placeholder, keyboardType]) => (
          <Field key={label} label={label}>
            <Input value={value} onChangeText={setter} placeholder={placeholder} keyboardType={keyboardType} />
          </Field>
        ))}
      </Card>

      <Text style={s.section}>Accepted Materials</Text>
      <Card>
        <View style={styles.materialGrid}>
          {MATERIALS.map(([id, label]) => {
            const selected = props.acceptedMaterials.includes(id);
            return (
              <TouchableOpacity
                key={id}
                onPress={() => props.toggleMaterial(id)}
                style={[styles.materialChip, selected && styles.materialChipSelected]}
              >
                <Ionicons
                  name={selected ? "checkmark-circle" : "ellipse-outline"}
                  size={16}
                  color={selected ? "#16874a" : "#78918b"}
                />
                <Text style={[styles.materialText, selected && { color: "#16874a" }]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      <Text style={s.section}>Service GPS Location</Text>
      <Card>
        <Btn
          outline
          disabled={props.gettingLocation}
          title={
            props.gettingLocation
              ? "Getting Location…"
              : props.collectorLocation
              ? "Update GPS Location"
              : "Use Current GPS Location"
          }
          onPress={props.captureLocation}
        />
        {!!props.collectorLocation && (
          <View style={styles.locationBox}>
            <Ionicons name="location" size={20} color="#16874a" />
            <Text style={styles.locationText}>
              {Number(props.collectorLocation.latitude).toFixed(6)}, {Number(props.collectorLocation.longitude).toFixed(6)}
            </Text>
          </View>
        )}
        <View style={{ marginTop: 11 }}>
          <Btn
            disabled={props.savingProfile}
            title={props.savingProfile ? "Saving Profile…" : "Save Collector Profile"}
            onPress={props.saveProfile}
          />
        </View>
      </Card>
    </>
  );
}

function Tab({ icon, label, badge, active, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.tab, active && styles.tabActive]}>
      <View>
        <Ionicons name={icon} size={20} color={active ? C.bg : C.muted} />
        {!!badge && (
          <View style={styles.tabBadge}>
            <Text style={styles.tabBadgeText}>{badge > 9 ? "9+" : badge}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.tabText, active && { color: C.bg }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Stat({ icon, value, label }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={18} color={C.green} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Quick({ icon, title, text, onPress, last }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.quick, last && { borderBottomWidth: 0 }]}>
      <View style={styles.quickIcon}>
        <Ionicons name={icon} size={19} color="#16874a" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.quickTitle}>{title}</Text>
        <Text style={styles.quickText}>{text}</Text>
      </View>
      <Ionicons name="chevron-forward" size={17} color="#78918b" />
    </TouchableOpacity>
  );
}

function Detail({ icon, text }) {
  return (
    <View style={styles.detail}>
      <Ionicons name={icon} size={14} color="#5e7c74" />
      <Text style={styles.detailText}>{text}</Text>
    </View>
  );
}

function Field({ label, children }) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function Input(props) {
  return (
    <TextInput
      {...props}
      placeholderTextColor="#849c95"
      style={[styles.input, props.style]}
    />
  );
}

function Empty({ text }) {
  return (
    <View style={styles.empty}>
      <Ionicons name="file-tray-outline" size={29} color={C.green} />
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

function uniqueById(items) {
  const map = new Map();
  items.forEach((item, index) => {
    if (!item) return;
    const id = item.id || `${item.materialId || "pickup"}-${index}`;
    if (!map.has(id)) map.set(id, item);
  });
  return [...map.values()];
}

function cleanDecimal(value) {
  const cleaned = String(value || "").replace(/[^0-9.]/g, "");
  return (cleaned.match(/\./g) || []).length <= 1 ? cleaned : cleaned.slice(0, -1);
}

function materialName(id) {
  return MATERIALS.find(([key]) => key === id)?.[1] || String(id || "Recyclable material").replace(/_/g, " ");
}

function quantityLabel(pickup) {
  if (pickup.originalQuantity != null) {
    return `${pickup.originalQuantity} ${pickup.originalUnit || "kg"} · ≈ ${Number(pickup.estimatedKg || 0).toFixed(2)} kg`;
  }
  return `${Number(pickup.estimatedKg || 0).toFixed(2)} kg`;
}

function formatAddress(address) {
  if (!address) return "";
  if (typeof address === "string") return address;
  return [address.addressLine, address.line1, address.city, address.state, address.postalCode]
    .filter(Boolean)
    .join(", ");
}

const styles = {
  notificationButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(32,211,90,.10)",
  },
  badge: {
    position: "absolute",
    right: -5,
    top: -5,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    backgroundColor: C.red,
  },
  badgeText: { color: "#fff", fontSize: 7, fontWeight: "900" },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    marginBottom: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.red,
    backgroundColor: "rgba(255,95,104,.10)",
  },
  errorText: { flex: 1, color: C.red, fontSize: 8, marginLeft: 7 },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 15,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.line,
  },
  heroIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    backgroundColor: "rgba(32,211,90,.11)",
  },
  heroEyebrow: { color: C.green, fontSize: 7, fontWeight: "900", letterSpacing: 0.8 },
  heroTitle: { color: C.text, fontSize: 16, fontWeight: "900", marginTop: 3 },
  heroText: { color: C.muted, fontSize: 8, marginTop: 3 },
  statusDot: { width: 12, height: 12, borderRadius: 6, marginLeft: 8 },
  tabs: {
    flexDirection: "row",
    padding: 4,
    marginVertical: 13,
    borderRadius: 13,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.line,
  },
  tab: { flex: 1, minHeight: 53, alignItems: "center", justifyContent: "center", borderRadius: 9 },
  tabActive: { backgroundColor: C.green },
  tabText: { color: C.muted, fontSize: 8, fontWeight: "800", marginTop: 3 },
  tabBadge: {
    position: "absolute",
    right: -12,
    top: -8,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    backgroundColor: C.red,
  },
  tabBadgeText: { color: "#fff", fontSize: 7, fontWeight: "900" },
  pendingBanner: { flexDirection: "row", alignItems: "flex-start", padding: 11, marginBottom: 11, borderRadius: 11, backgroundColor: "#fff1ce" },
  pendingTitle: { color: "#825b13", fontSize: 9, fontWeight: "900" },
  pendingText: { color: "#8c713c", fontSize: 8, lineHeight: 12, marginTop: 3 },
  statsRow: { flexDirection: "row", marginHorizontal: -3 },
  stat: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    marginHorizontal: 3,
    borderRadius: 12,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.line,
  },
  statValue: { color: C.text, fontSize: 15, fontWeight: "900", marginTop: 4 },
  statLabel: { color: C.muted, fontSize: 7, marginTop: 2 },
  earningsCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    marginTop: 8,
    borderRadius: 15,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.green,
  },
  earningsLabel: { color: C.green, fontSize: 7, fontWeight: "900", letterSpacing: 0.7 },
  earningsValue: { color: C.text, fontSize: 27, fontWeight: "900", marginTop: 4 },
  earningsText: { color: C.muted, fontSize: 8, marginTop: 2 },
  walletIcon: {
    width: 55,
    height: 55,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "auto",
    backgroundColor: "rgba(32,211,90,.11)",
  },
  quick: { minHeight: 60, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#dfe9e7" },
  quickIcon: {
    width: 37,
    height: 37,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
    backgroundColor: "#ddf8e6",
  },
  quickTitle: { color: "#173a31", fontSize: 10, fontWeight: "900" },
  quickText: { color: "#78918b", fontSize: 8, marginTop: 2 },
  jobTabs: { paddingBottom: 11 },
  jobTab: { height: 36, justifyContent: "center", paddingHorizontal: 12, marginRight: 7, borderRadius: 10, backgroundColor: C.panel, borderWidth: 1, borderColor: C.line },
  jobTabActive: { backgroundColor: C.green, borderColor: C.green },
  jobTabText: { color: C.muted, fontSize: 8, fontWeight: "800" },
  jobTabTextActive: { color: C.bg },
  activeJob: { borderWidth: 1, borderColor: C.green },
  jobHeader: { flexDirection: "row", alignItems: "center" },
  jobIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
    backgroundColor: "#ddf8e6",
  },
  cardTitle: { color: "#173a31", fontSize: 12, fontWeight: "900", textTransform: "capitalize" },
  cardText: { color: "#78918b", fontSize: 8, marginTop: 3 },
  detailsBox: { paddingTop: 9, marginTop: 10, marginBottom: 11, borderTopWidth: 1, borderTopColor: "#dfe9e7" },
  detail: { flexDirection: "row", alignItems: "center", marginTop: 5 },
  detailText: { flex: 1, color: "#5e7c74", fontSize: 9, marginLeft: 6 },
  actionRow: { flexDirection: "row" },
  verifyBox: { paddingTop: 11, marginTop: 11, borderTopWidth: 1, borderTopColor: "#dfe9e7" },
  verifyTitle: { color: "#173a31", fontSize: 12, fontWeight: "900", marginBottom: 9 },
  availability: { flexDirection: "row", alignItems: "center", padding: 13, borderRadius: 12, backgroundColor: C.panel, borderWidth: 1, borderColor: C.line },
  availabilityOn: { borderColor: C.green },
  availabilityTitle: { color: C.text, fontSize: 10, fontWeight: "900" },
  availabilityText: { color: C.muted, fontSize: 8, marginTop: 3 },
  label: { color: "#42695d", fontSize: 9, fontWeight: "800", marginBottom: 5 },
  input: { height: 47, color: "#173a31", paddingHorizontal: 11, borderRadius: 9, borderWidth: 1, borderColor: "#d4e3de", backgroundColor: "#fff" },
  materialGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -3 },
  materialChip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 7, margin: 3, borderRadius: 8, borderWidth: 1, borderColor: "#d7e4e0" },
  materialChipSelected: { borderColor: C.green, backgroundColor: "#e4fbea" },
  materialText: { color: "#6c8580", fontSize: 8, marginLeft: 4 },
  locationBox: { flexDirection: "row", alignItems: "center", padding: 10, marginTop: 10, borderRadius: 9, backgroundColor: "#e7fff0" },
  locationText: { color: "#42705c", fontSize: 9, marginLeft: 7 },
  empty: { alignItems: "center", padding: 24, borderRadius: 14, backgroundColor: C.panel, borderWidth: 1, borderColor: C.line },
  emptyText: { color: C.muted, fontSize: 9, textAlign: "center", marginTop: 7 },
};
