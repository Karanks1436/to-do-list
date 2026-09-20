// import React,{useEffect,useState}from'react';
// import{Alert,KeyboardAvoidingView,Platform,ScrollView,Text,TextInput,View}from'react-native';
// import*as Location from'expo-location';
// import{Btn,Card,Header,Pill}from'../components/UI';
// import{s}from'../styles';
// import{saveCollectorDetails}from'../firebase/marketplaceService';

// const MATERIALS=['plastic_pet','cardboard','paper','glass','metal_aluminium','metal_steel','ewaste'];
// const Input=props=><TextInput {...props} placeholderTextColor="#849c95" style={{height:48,color:'#173a31',borderWidth:1,borderColor:'#d4e3de',borderRadius:9,paddingHorizontal:12,marginBottom:12,backgroundColor:'#fff'}}/>;
// const Label=({children})=><Text style={{color:'#42695d',fontSize:11,fontWeight:'700',marginBottom:6}}>{children}</Text>;

// export default function CollectorDashboardScreen({user,profile,pickups=[],openPickups=[],accept,status,complete,logout}){
//  const[businessName,setBusinessName]=useState(''),[ownerName,setOwnerName]=useState(''),[phone,setPhone]=useState(''),[addressLine,setAddressLine]=useState(''),[city,setCity]=useState(''),[state,setState]=useState('Punjab'),[postalCode,setPostalCode]=useState(''),[serviceRadiusKm,setServiceRadiusKm]=useState('10'),[collectorLocation,setCollectorLocation]=useState(null),[gettingLocation,setGettingLocation]=useState(false),[saving,setSaving]=useState(false),[weights,setWeights]=useState({});
//  useEffect(()=>{setBusinessName(profile?.businessName||'');setOwnerName(profile?.ownerName||profile?.name||'');setPhone(profile?.phone||'');setAddressLine(profile?.addressLine||'');setCity(profile?.city||'');setState(profile?.state||'Punjab');setPostalCode(profile?.postalCode||'');setServiceRadiusKm(String(profile?.serviceRadiusKm||10));if(profile?.location?.latitude&&profile?.location?.longitude)setCollectorLocation(profile.location)},[profile]);
//  const capture=async()=>{try{setGettingLocation(true);const p=await Location.requestForegroundPermissionsAsync();if(p.status!=='granted')return Alert.alert('Permission required','Allow location so nearby users can find you.');const x=await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.High});setCollectorLocation({latitude:x.coords.latitude,longitude:x.coords.longitude,accuracy:x.coords.accuracy});Alert.alert('Location captured','Your collector location is ready to save.')}catch(e){Alert.alert('Location failed',e.message)}finally{setGettingLocation(false)}};
//  const save=async()=>{if(!user?.uid)return Alert.alert('Account unavailable');if(!businessName.trim()||!ownerName.trim()||!phone.trim()||!addressLine.trim()||!city.trim()||!postalCode.trim())return Alert.alert('Incomplete details','Fill every required collector detail.');if(!collectorLocation)return Alert.alert('Location required','Capture your GPS location.');const radius=Number(serviceRadiusKm);if(!Number.isFinite(radius)||radius<=0)return Alert.alert('Invalid radius');try{setSaving(true);await saveCollectorDetails(user.uid,{businessName,ownerName,phone,addressLine,city,state,postalCode,serviceRadiusKm:radius,acceptedMaterials:MATERIALS,location:collectorLocation});Alert.alert('Saved','Users can now find this collector after admin approval.')}catch(e){Alert.alert('Save failed',e.message)}finally{setSaving(false)}};
//  const finish=async id=>{const kg=Number(weights[id]);if(!Number.isFinite(kg)||kg<=0)return Alert.alert('Enter verified weight');try{await complete(id,kg);setWeights(v=>({...v,[id]:''}))}catch(e){Alert.alert('Completion failed',e.message)}};
//  return <KeyboardAvoidingView style={s.fill} behavior={Platform.OS==='ios'?'padding':undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.page}><Header title="Collector Dashboard"/><Text style={s.title}>{profile?.businessName||'Complete Collector Profile'}</Text><Text style={s.sub}>Account status: {profile?.status||'pending'}</Text>{profile?.status!=='active'&&<Card><Text style={s.whiteTitle}>Approval pending</Text><Text style={s.small}>Save your details and location. An administrator must approve the account before pickups can be accepted.</Text></Card>}<Text style={s.section}>Collector details</Text><Card><Label>Business or collector name</Label><Input value={businessName} onChangeText={setBusinessName} placeholder="Green Earth Recyclers"/><Label>Owner name</Label><Input value={ownerName} onChangeText={setOwnerName} placeholder="Owner full name"/><Label>Phone</Label><Input value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+91 98765 43210"/><Label>Address</Label><Input value={addressLine} onChangeText={setAddressLine} placeholder="Street and area"/><Label>City</Label><Input value={city} onChangeText={setCity} placeholder="Bathinda"/><Label>State</Label><Input value={state} onChangeText={setState}/><Label>Postal code</Label><Input value={postalCode} onChangeText={setPostalCode} keyboardType="number-pad" placeholder="151001"/><Label>Service radius (km)</Label><Input value={serviceRadiusKm} onChangeText={setServiceRadiusKm} keyboardType="decimal-pad"/><Btn outline disabled={gettingLocation} title={gettingLocation?'Getting location…':collectorLocation?'Update GPS Location':'Use Current GPS Location'} onPress={capture}/>{collectorLocation&&<View style={{backgroundColor:'#e7fff0',padding:12,borderRadius:10,marginVertical:12}}><Text style={{color:'#17643d',fontWeight:'700'}}>GPS selected</Text><Text style={{color:'#42705c',fontSize:11}}>{collectorLocation.latitude.toFixed(6)}, {collectorLocation.longitude.toFixed(6)}</Text></View>}<Btn disabled={saving} title={saving?'Saving…':'Save Collector Details'} onPress={save}/></Card>{profile?.status==='active'&&<><Text style={s.section}>Assigned pickups</Text>{!pickups.length&&<Card><Text style={s.whiteTitle}>No assigned pickups</Text></Card>}{pickups.map(p=><Card key={p.id}><View style={s.between}><View><Text style={s.whiteTitle}>{p.materialId}</Text><Text style={s.small}>{p.estimatedKg} kg · ₹{p.estimatedValue||0}</Text></View><Pill text={String(p.status).replaceAll('_',' ')}/></View><View style={{marginTop:12,gap:8}}>{p.status==='accepted'&&<Btn title="Start trip" onPress={()=>status(p.id,'on_the_way')}/>} {p.status==='on_the_way'&&<Btn title="Mark arrived" onPress={()=>status(p.id,'arrived')}/>} {p.status==='arrived'&&<><Input value={weights[p.id]||''} onChangeText={v=>setWeights(x=>({...x,[p.id]:v}))} keyboardType="decimal-pad" placeholder="Verified weight in kg"/><Btn title="Complete pickup" onPress={()=>finish(p.id)}/></>}</View></Card>)}<Text style={s.section}>Open pickup requests</Text>{!openPickups.length&&<Card><Text style={s.whiteTitle}>No open requests</Text></Card>}{openPickups.map(p=><Card key={p.id}><Text style={s.whiteTitle}>{p.materialId} · {p.estimatedKg} kg</Text><Text style={[s.small,{marginBottom:10}]}>Estimated ₹{p.estimatedValue||0}</Text><Btn title="Accept pickup" onPress={()=>accept(p.id)}/></Card>)}</>}<View style={{marginTop:20}}><Btn outline title="Reset guest session" onPress={logout}/></View></ScrollView></KeyboardAvoidingView>
// }


import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
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
  ["ewaste", "E-waste"],
  ["organic", "Organic"],
  ["textile", "Textile"],
];

const ACTIVE_STATUSES = ["accepted", "on_the_way", "arrived"];

export default function CollectorDashboardScreen({
  user,
  profile,
  pickups = [],
  openPickups = [],
  transactions = [],
  accept,
  decline,
  status,
  complete,
  logout,
}) {
  const [tab, setTab] = useState("overview");
  const [jobFilter, setJobFilter] = useState("requests");
  const [busy, setBusy] = useState(null);
  const [weights, setWeights] = useState({});
  const [verifiedMaterials, setVerifiedMaterials] = useState({});
  const [notes, setNotes] = useState({});

  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("Punjab");
  const [postalCode, setPostalCode] = useState("");
  const [serviceRadiusKm, setServiceRadiusKm] = useState("10");
  const [acceptedMaterials, setAcceptedMaterials] = useState(MATERIALS.map(([id]) => id));
  const [availableForPickups, setAvailableForPickups] = useState(true);
  const [collectorLocation, setCollectorLocation] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setBusinessName(profile?.businessName || "");
    setOwnerName(profile?.ownerName || profile?.name || "");
    setPhone(profile?.phone || "");
    setAddressLine(profile?.addressLine || "");
    setCity(profile?.city || "");
    setState(profile?.state || "Punjab");
    setPostalCode(profile?.postalCode || "");
    setServiceRadiusKm(String(profile?.serviceRadiusKm || 10));
    setAcceptedMaterials(
      profile?.acceptedMaterials?.length
        ? profile.acceptedMaterials
        : MATERIALS.map(([id]) => id)
    );
    setAvailableForPickups(profile?.availableForPickups !== false);
    if (profile?.location?.latitude && profile?.location?.longitude) {
      setCollectorLocation(profile.location);
    }
  }, [profile]);

  const visibleOpenRequests = useMemo(
    () =>
      openPickups.filter(
        (item) => !(item.declinedCollectorIds || []).includes(user?.uid)
      ),
    [openPickups, user?.uid]
  );
  const assignedRequests = pickups.filter((item) => item.status === "requested");
  const newRequests = [...assignedRequests, ...visibleOpenRequests].filter(
    (item, index, list) => list.findIndex((other) => other.id === item.id) === index
  );
  const activeJobs = pickups.filter((item) => ACTIVE_STATUSES.includes(item.status));
  const completedJobs = pickups.filter((item) => item.status === "completed");
  const earnings = transactions.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );
  const recycledKg = transactions.reduce(
    (sum, item) => sum + Number(item.weightKg || 0),
    0
  );

  const captureLocation = async () => {
    try {
      setGettingLocation(true);
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        return Alert.alert(
          "Permission required",
          "Allow location so nearby users can find your collection service."
        );
      }
      const result = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setCollectorLocation({
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
        accuracy: result.coords.accuracy,
      });
      Alert.alert("Location captured", "Save your profile to publish this location.");
    } catch (error) {
      Alert.alert("Location failed", error?.message || "Unable to get GPS location.");
    } finally {
      setGettingLocation(false);
    }
  };

  const saveProfile = async () => {
    if (!user?.uid) return Alert.alert("Account unavailable");
    if (
      !businessName.trim() ||
      !ownerName.trim() ||
      !phone.trim() ||
      !addressLine.trim() ||
      !city.trim() ||
      !postalCode.trim()
    ) {
      return Alert.alert("Incomplete details", "Fill every required collector field.");
    }
    if (!collectorLocation) {
      return Alert.alert("Location required", "Capture your current GPS location.");
    }
    if (!acceptedMaterials.length) {
      return Alert.alert("Materials required", "Select at least one accepted material.");
    }
    const radius = Number(serviceRadiusKm);
    if (!Number.isFinite(radius) || radius <= 0) {
      return Alert.alert("Invalid radius", "Enter a service radius greater than zero.");
    }

    try {
      setSaving(true);
      await saveCollectorDetails(user.uid, {
        businessName,
        ownerName,
        phone,
        addressLine,
        city,
        state,
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
      setSaving(false);
    }
  };

  const runAction = async (key, action, successMessage) => {
    try {
      setBusy(key);
      await action();
      if (successMessage) Alert.alert("Updated", successMessage);
    } catch (error) {
      Alert.alert("Action failed", error?.message || "Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const acceptRequest = (pickup) =>
    runAction(`accept-${pickup.id}`, () => accept(pickup.id), "Pickup accepted.");

  const confirmDecline = (pickup) => {
    Alert.alert(
      "Decline pickup?",
      "This request will be released to other approved collectors and hidden from your list.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Decline",
          style: "destructive",
          onPress: () =>
            runAction(
              `decline-${pickup.id}`,
              () => decline(pickup.id, "Collector unavailable"),
              "Pickup declined."
            ),
        },
      ]
    );
  };

  const changeStatus = (pickupId, nextStatus) =>
    runAction(
      `status-${pickupId}`,
      () => status(pickupId, nextStatus),
      nextStatus === "on_the_way" ? "Trip started." : "Marked as arrived."
    );

  const finishPickup = (pickup) => {
    const finalKg = Number(weights[pickup.id]);
    const verifiedMaterialId = String(
      verifiedMaterials[pickup.id] || pickup.materialId || ""
    ).trim();
    if (!Number.isFinite(finalKg) || finalKg <= 0) {
      return Alert.alert("Weight required", "Enter the collector-verified weight in kg.");
    }
    if (!verifiedMaterialId) {
      return Alert.alert("Material required", "Enter the verified material ID.");
    }
    Alert.alert(
      "Complete pickup?",
      `${finalKg.toFixed(2)} kg of ${formatMaterial(verifiedMaterialId)} will be settled at ₹${Number(
        pickup.ratePerKg || 0
      ).toFixed(2)}/kg.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Complete",
          onPress: () =>
            runAction(
              `complete-${pickup.id}`,
              () =>
                complete(pickup.id, {
                  finalKg,
                  verifiedMaterialId,
                  collectorNotes: notes[pickup.id] || "",
                }),
              "Pickup completed and settlement recorded."
            ).then(() => {
              setWeights((current) => ({ ...current, [pickup.id]: "" }));
              setNotes((current) => ({ ...current, [pickup.id]: "" }));
            }),
        },
      ]
    );
  };

  const openDirections = async (pickup) => {
    const location = pickup.giverLocation;
    const destination =
      location?.latitude && location?.longitude
        ? `${location.latitude},${location.longitude}`
        : encodeURIComponent(formatAddress(pickup.address) || "");
    if (!destination) {
      return Alert.alert("Address unavailable", "The giver did not provide a pickup location.");
    }
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert("Maps unavailable", error?.message || "Unable to open directions.");
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
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.page}
        showsVerticalScrollIndicator={false}
      >
        <Header title="Collector Dashboard" />

        <View style={styles.hero}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>
              {profile?.businessName || profile?.name || "Collector"}
            </Text>
            <Text style={styles.heroText}>
              {profile?.status === "active"
                ? availableForPickups
                  ? "Active and accepting pickups"
                  : "Active · currently unavailable"
                : "Waiting for administrator approval"}
            </Text>
          </View>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: profile?.status === "active" ? C.green : "#f0ad35" },
            ]}
          />
        </View>

        <View style={styles.mainTabs}>
          <DashboardTab
            icon="grid-outline"
            label="Overview"
            active={tab === "overview"}
            onPress={() => setTab("overview")}
          />
          <DashboardTab
            icon="cube-outline"
            label="Pickups"
            badge={newRequests.length}
            active={tab === "jobs"}
            onPress={() => setTab("jobs")}
          />
          <DashboardTab
            icon="business-outline"
            label="Profile"
            active={tab === "profile"}
            onPress={() => setTab("profile")}
          />
        </View>

        {profile?.status !== "active" && (
          <Card>
            <Text style={s.whiteTitle}>Approval pending</Text>
            <Text style={[styles.cardMuted, { marginTop: 5 }]}>
              Complete and save your business details, materials and GPS location.
              An administrator must approve your account before you can accept pickups.
            </Text>
          </Card>
        )}

        {tab === "overview" && (
          <>
            <View style={styles.statsRow}>
              <Stat value={newRequests.length} label="New requests" icon="notifications-outline" />
              <Stat value={activeJobs.length} label="Active jobs" icon="navigate-outline" />
            </View>
            <View style={styles.statsRow}>
              <Stat value={`${recycledKg.toFixed(1)} kg`} label="Collected" icon="leaf-outline" />
              <Stat value={`₹${earnings.toFixed(0)}`} label="Earnings" icon="wallet-outline" />
            </View>

            <Text style={s.section}>Quick actions</Text>
            <Card>
              <QuickAction
                icon="notifications-outline"
                title="Review pickup requests"
                subtitle={`${newRequests.length} request${newRequests.length === 1 ? "" : "s"} available`}
                onPress={() => {
                  setJobFilter("requests");
                  setTab("jobs");
                }}
              />
              <QuickAction
                icon="navigate-outline"
                title="Continue active pickups"
                subtitle={`${activeJobs.length} pickup${activeJobs.length === 1 ? "" : "s"} in progress`}
                onPress={() => {
                  setJobFilter("active");
                  setTab("jobs");
                }}
              />
              <QuickAction
                icon="location-outline"
                title="Update service location"
                subtitle={collectorLocation ? "GPS location is saved" : "GPS location required"}
                onPress={() => setTab("profile")}
                last
              />
            </Card>

            <Text style={s.section}>Recent completed pickups</Text>
            {!completedJobs.length ? (
              <Empty text="No completed pickups yet." />
            ) : (
              completedJobs.slice(0, 3).map((pickup) => (
                <PickupSummary key={pickup.id} pickup={pickup} />
              ))
            )}
          </>
        )}

        {tab === "jobs" && (
          <>
            <View style={styles.filterTabs}>
              {[
                ["requests", `Requests (${newRequests.length})`],
                ["active", `Active (${activeJobs.length})`],
                ["completed", `Done (${completedJobs.length})`],
              ].map(([id, label]) => (
                <TouchableOpacity
                  key={id}
                  onPress={() => setJobFilter(id)}
                  style={[styles.filterButton, jobFilter === id && styles.filterButtonActive]}
                >
                  <Text
                    style={[
                      styles.filterText,
                      jobFilter === id && { color: C.bg },
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {jobFilter === "requests" && (
              <>
                <Text style={s.section}>New pickup requests</Text>
                {profile?.status !== "active" ? (
                  <Empty text="Admin approval is required before requests can be accepted." />
                ) : !newRequests.length ? (
                  <Empty text="No new requests in your service area." />
                ) : (
                  newRequests.map((pickup) => (
                    <RequestCard
                      key={pickup.id}
                      pickup={pickup}
                      busy={busy}
                      accept={() => acceptRequest(pickup)}
                      decline={() => confirmDecline(pickup)}
                      directions={() => openDirections(pickup)}
                    />
                  ))
                )}
              </>
            )}

            {jobFilter === "active" && (
              <>
                <Text style={s.section}>Active pickups</Text>
                {!activeJobs.length ? (
                  <Empty text="No pickups currently in progress." />
                ) : (
                  activeJobs.map((pickup) => (
                    <ActivePickupCard
                      key={pickup.id}
                      pickup={pickup}
                      busy={busy}
                      weights={weights}
                      setWeights={setWeights}
                      verifiedMaterials={verifiedMaterials}
                      setVerifiedMaterials={setVerifiedMaterials}
                      notes={notes}
                      setNotes={setNotes}
                      start={() => changeStatus(pickup.id, "on_the_way")}
                      arrive={() => changeStatus(pickup.id, "arrived")}
                      finish={() => finishPickup(pickup)}
                      directions={() => openDirections(pickup)}
                    />
                  ))
                )}
              </>
            )}

            {jobFilter === "completed" && (
              <>
                <Text style={s.section}>Completed pickups</Text>
                {!completedJobs.length ? (
                  <Empty text="No completed pickups yet." />
                ) : (
                  completedJobs.map((pickup) => (
                    <PickupSummary key={pickup.id} pickup={pickup} />
                  ))
                )}
              </>
            )}
          </>
        )}

        {tab === "profile" && (
          <>
            <Text style={s.section}>Availability</Text>
            <TouchableOpacity
              onPress={() => setAvailableForPickups((value) => !value)}
              style={[
                styles.availability,
                availableForPickups && styles.availabilityOn,
              ]}
            >
              <Ionicons
                name={availableForPickups ? "radio-button-on" : "pause-circle-outline"}
                size={25}
                color={availableForPickups ? C.green : C.muted}
              />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.availabilityTitle}>
                  {availableForPickups ? "Accepting new pickups" : "Not accepting pickups"}
                </Text>
                <Text style={styles.availabilityText}>
                  Save below to publish this availability.
                </Text>
              </View>
            </TouchableOpacity>

            <Text style={s.section}>Collector details</Text>
            <Card>
              <Label>Business or collector name</Label>
              <Input value={businessName} onChangeText={setBusinessName} placeholder="Green Earth Recyclers" />
              <Label>Owner name</Label>
              <Input value={ownerName} onChangeText={setOwnerName} placeholder="Owner full name" />
              <Label>Phone</Label>
              <Input value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+91 98765 43210" />
              <Label>Address</Label>
              <Input value={addressLine} onChangeText={setAddressLine} placeholder="Street and area" />
              <Label>City</Label>
              <Input value={city} onChangeText={setCity} placeholder="Ludhiana" />
              <Label>State</Label>
              <Input value={state} onChangeText={setState} />
              <Label>Postal code</Label>
              <Input value={postalCode} onChangeText={setPostalCode} keyboardType="number-pad" placeholder="141001" />
              <Label>Service radius (km)</Label>
              <Input value={serviceRadiusKm} onChangeText={setServiceRadiusKm} keyboardType="decimal-pad" />
            </Card>

            <Text style={s.section}>Accepted materials</Text>
            <Card>
              <View style={styles.materialGrid}>
                {MATERIALS.map(([id, label]) => {
                  const selected = acceptedMaterials.includes(id);
                  return (
                    <TouchableOpacity
                      key={id}
                      onPress={() => toggleMaterial(id)}
                      style={[styles.materialChip, selected && styles.materialChipOn]}
                    >
                      <Ionicons
                        name={selected ? "checkmark-circle" : "ellipse-outline"}
                        size={16}
                        color={selected ? "#167340" : "#78918b"}
                      />
                      <Text style={[styles.materialText, selected && { color: "#167340" }]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Card>

            <Text style={s.section}>Service GPS location</Text>
            <Card>
              <Btn
                outline
                disabled={gettingLocation}
                title={
                  gettingLocation
                    ? "Getting location…"
                    : collectorLocation
                    ? "Update GPS Location"
                    : "Use Current GPS Location"
                }
                onPress={captureLocation}
              />
              {collectorLocation && (
                <View style={styles.gpsBox}>
                  <Ionicons name="location" size={20} color="#17643d" />
                  <View style={{ marginLeft: 8 }}>
                    <Text style={styles.gpsTitle}>GPS selected</Text>
                    <Text style={styles.gpsText}>
                      {Number(collectorLocation.latitude).toFixed(6)},{" "}
                      {Number(collectorLocation.longitude).toFixed(6)}
                    </Text>
                  </View>
                </View>
              )}
              <View style={{ marginTop: 12 }}>
                <Btn
                  disabled={saving}
                  title={saving ? "Saving…" : "Save Collector Profile"}
                  onPress={saveProfile}
                />
              </View>
            </Card>
          </>
        )}

        <View style={{ marginTop: 22 }}>
          <Btn outline title="Logout" onPress={logout} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function RequestCard({ pickup, busy, accept, decline, directions }) {
  return (
    <Card>
      <View style={s.between}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={s.whiteTitle}>{formatMaterial(pickup.materialId)}</Text>
          <Text style={styles.cardMuted}>
            {formatQuantity(pickup)} · Est. ₹{Number(pickup.estimatedValue || 0).toFixed(0)}
          </Text>
        </View>
        <Pill text={pickup.status === "requested" ? "DIRECT REQUEST" : "OPEN"} solid />
      </View>
      <PickupDetails pickup={pickup} />
      <View style={styles.actionRow}>
        <View style={{ flex: 1, marginRight: 5 }}>
          <Btn
            disabled={busy === `decline-${pickup.id}` || !!busy}
            outline
            title={busy === `decline-${pickup.id}` ? "Declining…" : "Decline"}
            onPress={decline}
          />
        </View>
        <View style={{ flex: 1, marginLeft: 5 }}>
          <Btn
            disabled={busy === `accept-${pickup.id}` || !!busy}
            title={busy === `accept-${pickup.id}` ? "Accepting…" : "Accept"}
            onPress={accept}
          />
        </View>
      </View>
      <TouchableOpacity onPress={directions} style={styles.mapLink}>
        <Ionicons name="navigate-outline" size={16} color="#16874a" />
        <Text style={styles.mapText}>Preview pickup directions</Text>
      </TouchableOpacity>
    </Card>
  );
}

function ActivePickupCard({
  pickup,
  busy,
  weights,
  setWeights,
  verifiedMaterials,
  setVerifiedMaterials,
  notes,
  setNotes,
  start,
  arrive,
  finish,
  directions,
}) {
  const actionBusy = busy?.endsWith(pickup.id);
  return (
    <Card>
      <View style={s.between}>
        <View style={{ flex: 1 }}>
          <Text style={s.whiteTitle}>{formatMaterial(pickup.materialId)}</Text>
          <Text style={styles.cardMuted}>{formatQuantity(pickup)}</Text>
        </View>
        <Pill text={String(pickup.status).replace(/_/g, " ").toUpperCase()} solid />
      </View>
      <PickupDetails pickup={pickup} />
      <TouchableOpacity onPress={directions} style={styles.mapLink}>
        <Ionicons name="navigate" size={16} color="#16874a" />
        <Text style={styles.mapText}>Open directions in Google Maps</Text>
      </TouchableOpacity>

      <View style={{ marginTop: 12 }}>
        {pickup.status === "accepted" && (
          <Btn disabled={actionBusy} title="Start Trip" onPress={start} />
        )}
        {pickup.status === "on_the_way" && (
          <Btn disabled={actionBusy} title="Mark Arrived" onPress={arrive} />
        )}
        {pickup.status === "arrived" && (
          <>
            <Text style={styles.verifyTitle}>Collector verification</Text>
            <Label>Verified material ID</Label>
            <Input
              value={verifiedMaterials[pickup.id] ?? pickup.materialId ?? ""}
              onChangeText={(value) =>
                setVerifiedMaterials((current) => ({ ...current, [pickup.id]: value }))
              }
              autoCapitalize="none"
              placeholder="plastic_pet"
            />
            <Label>Verified weight in kg</Label>
            <Input
              value={weights[pickup.id] || ""}
              onChangeText={(value) =>
                setWeights((current) => ({ ...current, [pickup.id]: value }))
              }
              keyboardType="decimal-pad"
              placeholder="0.00"
            />
            <Label>Quality or settlement notes (optional)</Label>
            <Input
              value={notes[pickup.id] || ""}
              onChangeText={(value) =>
                setNotes((current) => ({ ...current, [pickup.id]: value }))
              }
              placeholder="Clean, dry, sorted…"
            />
            <Text style={styles.settlementText}>
              Settlement uses the saved rate of ₹{Number(pickup.ratePerKg || 0).toFixed(2)}/kg.
            </Text>
            <Btn disabled={actionBusy} title="Verify & Complete Pickup" onPress={finish} />
          </>
        )}
      </View>
    </Card>
  );
}

function PickupDetails({ pickup }) {
  const address = formatAddress(pickup.address);
  return (
    <View style={styles.detailsBox}>
      <Detail icon="pricetag-outline" text={`Rate: ₹${Number(pickup.ratePerKg || 0).toFixed(2)}/kg`} />
      {!!address && <Detail icon="location-outline" text={address} />}
      <Detail icon="time-outline" text={`Requested ${formatDate(pickup.createdAt)}`} />
    </View>
  );
}

function PickupSummary({ pickup }) {
  return (
    <Card>
      <View style={s.between}>
        <View style={{ flex: 1 }}>
          <Text style={s.whiteTitle}>
            {formatMaterial(pickup.verifiedMaterialId || pickup.materialId)}
          </Text>
          <Text style={styles.cardMuted}>
            {Number(pickup.finalKg || pickup.estimatedKg || 0).toFixed(2)} kg · ₹
            {Number(pickup.finalAmount || pickup.estimatedValue || 0).toFixed(0)}
          </Text>
        </View>
        <Pill text="COMPLETED" solid />
      </View>
      <Text style={[styles.cardMuted, { marginTop: 8 }]}>
        {formatDate(pickup.completedAt || pickup.updatedAt)}
      </Text>
    </Card>
  );
}

function DashboardTab({ icon, label, active, badge, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.mainTab, active && styles.mainTabOn]}>
      <View>
        <Ionicons name={icon} size={20} color={active ? C.bg : C.muted} />
        {!!badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 9 ? "9+" : badge}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.mainTabText, active && { color: C.bg }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Stat({ value, label, icon }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={19} color={C.green} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function QuickAction({ icon, title, subtitle, onPress, last }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.quickAction, last && { borderBottomWidth: 0 }]}>
      <View style={styles.quickIcon}>
        <Ionicons name={icon} size={20} color="#16874a" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.quickTitle}>{title}</Text>
        <Text style={styles.quickText}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#78918b" />
    </TouchableOpacity>
  );
}

function Detail({ icon, text }) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={14} color="#5e7c74" />
      <Text style={styles.detailText}>{text}</Text>
    </View>
  );
}

function Empty({ text }) {
  return (
    <View style={styles.empty}>
      <Ionicons name="file-tray-outline" size={29} color={C.green} />
      <Text style={[s.small, { marginTop: 7, textAlign: "center" }]}>{text}</Text>
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

function Label({ children }) {
  return <Text style={styles.label}>{children}</Text>;
}

function formatMaterial(id) {
  const match = MATERIALS.find(([materialId]) => materialId === id);
  return match?.[1] || String(id || "Recyclable material").replace(/_/g, " ");
}

function formatQuantity(pickup) {
  if (pickup.originalQuantity && pickup.originalUnit) {
    return `${pickup.originalQuantity} ${pickup.originalUnit} (≈ ${Number(
      pickup.estimatedKg || 0
    ).toFixed(2)} kg)`;
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

function formatDate(value) {
  const date = value?.toDate?.() || (value ? new Date(value) : null);
  if (!date || Number.isNaN(date.getTime())) return "recently";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const styles = {
  hero: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 15,
    padding: 16,
    marginTop: 8,
  },
  heroTitle: { color: C.text, fontSize: 18, fontWeight: "900" },
  heroText: { color: C.muted, fontSize: 11, marginTop: 4 },
  statusDot: { width: 13, height: 13, borderRadius: 7, marginLeft: 10 },
  mainTabs: {
    flexDirection: "row",
    backgroundColor: C.panel,
    borderRadius: 13,
    padding: 4,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: C.line,
  },
  mainTab: {
    flex: 1,
    minHeight: 54,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  mainTabOn: { backgroundColor: C.green },
  mainTabText: { color: C.muted, fontSize: 10, fontWeight: "700", marginTop: 2 },
  badge: {
    position: "absolute",
    right: -11,
    top: -7,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: C.red,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: { color: "#fff", fontSize: 8, fontWeight: "900" },
  statsRow: { flexDirection: "row", marginHorizontal: -4, marginBottom: 8 },
  stat: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: C.panel2,
    borderRadius: 13,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.line,
  },
  statValue: { color: C.text, fontSize: 18, fontWeight: "900", marginTop: 5 },
  statLabel: { color: C.muted, fontSize: 9, marginTop: 2 },
  cardMuted: { color: "#58766f", fontSize: 11 },
  quickAction: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#dfe9e7",
  },
  quickIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ddf8e6",
    marginRight: 10,
  },
  quickTitle: { color: "#173a31", fontSize: 12, fontWeight: "800" },
  quickText: { color: "#6a857e", fontSize: 10, marginTop: 2 },
  filterTabs: {
    flexDirection: "row",
    backgroundColor: C.panel,
    borderRadius: 11,
    padding: 3,
  },
  filterButton: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8 },
  filterButtonActive: { backgroundColor: C.green },
  filterText: { color: C.muted, fontSize: 9, fontWeight: "800" },
  actionRow: { flexDirection: "row", marginTop: 13 },
  mapLink: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  mapText: { color: "#16874a", fontSize: 11, fontWeight: "700", marginLeft: 5 },
  detailsBox: {
    marginTop: 11,
    paddingTop: 9,
    borderTopWidth: 1,
    borderTopColor: "#dfe9e7",
  },
  detailRow: { flexDirection: "row", alignItems: "center", marginTop: 5 },
  detailText: { flex: 1, color: "#5e7c74", fontSize: 10, marginLeft: 6 },
  verifyTitle: {
    color: "#173a31",
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#dfe9e7",
  },
  settlementText: {
    color: "#54736c",
    backgroundColor: "#edf7f1",
    padding: 9,
    borderRadius: 8,
    fontSize: 10,
    marginBottom: 11,
  },
  availability: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 13,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.line,
  },
  availabilityOn: { borderColor: C.green },
  availabilityTitle: { color: C.text, fontSize: 13, fontWeight: "800" },
  availabilityText: { color: C.muted, fontSize: 9, marginTop: 3 },
  input: {
    height: 48,
    color: "#173a31",
    borderWidth: 1,
    borderColor: "#d4e3de",
    borderRadius: 9,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  label: { color: "#42695d", fontSize: 11, fontWeight: "700", marginBottom: 6 },
  materialGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -3 },
  materialChip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d7e4e0",
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 8,
    margin: 3,
  },
  materialChipOn: { borderColor: C.green, backgroundColor: "#e4fbea" },
  materialText: { color: "#6c8580", fontSize: 10, marginLeft: 4 },
  gpsBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e7fff0",
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  gpsTitle: { color: "#17643d", fontWeight: "700", fontSize: 11 },
  gpsText: { color: "#42705c", fontSize: 10, marginTop: 2 },
  empty: {
    padding: 24,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.line,
  },
};
