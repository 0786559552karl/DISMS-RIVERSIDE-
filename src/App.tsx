/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  MapPin, 
  Shield, 
  User, 
  Plus, 
  History as HistoryIcon, 
  BarChart3, 
  Download, 
  LogOut, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle2,
  Menu,
  X,
  Lock,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  Save,
  FileText,
  Users,
  Briefcase,
  GraduationCap,
  Calendar,
  Activity,
  Building2
} from 'lucide-react';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  onSnapshot, 
  serverTimestamp, 
  updateDoc, 
  addDoc,
  deleteDoc,
  handleFirestoreError,
  OperationType
} from './firebase';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line
} from 'recharts';
import { format } from 'date-fns';
import { cn } from './lib/utils';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet marker icon issue
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Helper to update map view when coordinates change
const ChangeView = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  map.setView(center, 18);
  return null;
};

// --- Types ---

interface Member {
  id?: string;
  loginId: string;
  standNumber: string;
  locationDetails: {
    farmName: string;
    farmSize: string;
    deedNumber: string;
    province: string;
    constituency: string;
    ward: string;
    pollingStation: string;
    district: string;
    branch: string;
    cellVillage: string;
  };
  ownershipStatus: {
    status: string;
    disputeExplanation: string;
  };
  allocationHistory: {
    allocator: string;
    allocatorName: string;
    amountPaid: string;
  };
  developmentHistory: {
    initiator: string;
    developerName: string;
    amountPaid: string;
    isDone: string;
    developmentDone: string;
  };
  adminOrgan: {
    type: string;
    name: string;
    regNumber: string;
    address: string;
    contactNumbers: string;
  };
  beneficiary: {
    standNumber: string;
    standSize: string;
    fullNames: string;
    idNumber: string;
    dob: string;
    gender: string;
    maritalStatus: string;
    contactNumber: string;
    isEmployed: string;
    education: string;
  };
  spouse: {
    fullNames: string;
    idNumber: string;
    dob: string;
    gender: string;
    contactNumber: string;
    isEmployed: string;
  };
  children: {
    fullNames: string;
    idNumber: string;
    dob: string;
    gender: string;
    contactNumber: string;
    isEmployed: string;
  };
  dependants: {
    fullNames: string;
    idNumber: string;
    dob: string;
    gender: string;
    contactNumber: string;
    relationship: string;
  };
  stateOfDevelopment: {
    structure: string;
    waterSource: string;
    wasteDisposal: string;
    lightingEnergy: string;
  };
  infrastructure: {
    roads: string;
    drainage: string;
    booster: string;
    internet: string;
  };
  educationInfra: {
    eceAvailable: string;
    crecheName: string;
    distance: string;
  };
  healthInfra: {
    facilityType: string;
    facilityName: string;
    distance: string;
  };
  goodsSupply: {
    foodSource: string;
    constSource: string;
  };
  religion: {
    religion: string;
    denomination: string;
  };
  tenant: {
    fullNames: string;
    idNumber: string;
    dob: string;
    gender: string;
    contactNumber: string;
    isEmployed: string;
  };
  lastLocation?: {
    lat: number;
    lng: number;
    timestamp: any;
  };
  createdAt: any;
  updatedAt: any;
}

interface ActivityLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  details: string;
  timestamp: any;
}

// --- Components ---

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  return (
    <motion.div 
      className="fixed inset-0 bg-black flex items-center justify-center z-50"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 1, delay: 3 }}
      onAnimationComplete={onComplete}
    >
      <motion.h1 
        className="text-6xl md:text-8xl font-bold text-white tracking-[0.2em]"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      >
        VISION 2030
      </motion.h1>
    </motion.div>
  );
};

const MapPlaceholder = ({ lat, lng }: { lat: number | null, lng: number | null }) => {
  if (!lat || !lng) {
    return (
      <div className="relative w-full h-64 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-inner flex items-center justify-center">
        <div className="text-slate-400 flex flex-col items-center">
          <MapPin className="w-10 h-10 mb-2 opacity-50 animate-bounce" />
          <span className="text-sm font-medium">Locating settlement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-80 rounded-2xl overflow-hidden border-2 border-slate-900 shadow-2xl z-0">
      <MapContainer 
        center={[lat, lng]} 
        zoom={18} 
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
        <Marker position={[lat, lng]} />
        <ChangeView center={[lat, lng]} />
      </MapContainer>
      
      <div className="absolute top-4 right-4 z-[1000] bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-2">
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
        <span className="text-[10px] font-bold text-white uppercase tracking-widest">Satellite Live</span>
      </div>

      <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200 shadow-lg">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-red-500" />
          <span className="text-xs font-mono font-bold text-slate-700">
            {lat.toFixed(6)}, {lng.toFixed(6)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [searchId, setSearchId] = useState('');
  const [searchStand, setSearchStand] = useState('');
  const [searchResult, setSearchResult] = useState<Member | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'members' | 'register' | 'history'>('dashboard');
  const [members, setMembers] = useState<Member[]>([]);
  const [history, setHistory] = useState<ActivityLog[]>([]);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Auth & Data ---

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isAdminAuthenticated) {
      const qMembers = query(collection(db, 'members'));
      const unsubMembers = onSnapshot(qMembers, (snapshot) => {
        setMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member)));
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'members'));

      const qHistory = query(collection(db, 'history'), where('timestamp', '!=', null));
      const unsubHistory = onSnapshot(qHistory, (snapshot) => {
        const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog));
        setHistory(logs.sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds));
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'history'));

      return () => {
        unsubMembers();
        unsubHistory();
      };
    }
  }, [isAdminAuthenticated]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => console.error("Geolocation error:", err)
      );
    }
  }, []);

  // --- Handlers ---

  const logActivity = async (action: string, details: string) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'history'), {
        userId: user.uid,
        userEmail: user.email,
        action,
        details,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.error("Failed to log activity:", err);
    }
  };

  const handleSearch = async () => {
    setSearchError(null);
    setSearchResult(null);
    if (!searchId || !searchStand) {
      setSearchError("Please enter both ID and Stand Number.");
      return;
    }

    try {
      const q = query(
        collection(db, 'members'), 
        where('loginId', '==', searchId),
        where('standNumber', '==', searchStand)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        setSearchError("No match found. Please contact us for registration: +263777965084 / 0786559552 / marxmuronzi@gmail.com");
      } else {
        const data = snapshot.docs[0].data() as Member;
        setSearchResult(data);
        // Record location if found
        if (location) {
          await updateDoc(doc(db, 'members', snapshot.docs[0].id), {
            lastLocation: {
              lat: location.lat,
              lng: location.lng,
              timestamp: serverTimestamp()
            }
          });
        }
      }
    } catch (err) {
      setSearchError("An error occurred during search. Please try again.");
      handleFirestoreError(err, OperationType.GET, 'members');
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await deleteDoc(doc(db, 'members', id));
        logActivity('Delete Member', `Deleted member ${name}`);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `members/${id}`);
      }
    }
  };

  const handleAdminLogin = async () => {
    if (adminPassword === 'G8wJ#4pL9') {
      if (!user) {
        try {
          await signInWithPopup(auth, googleProvider);
        } catch (err) {
          alert("Login failed. Please try again.");
          return;
        }
      }
      setIsAdminAuthenticated(true);
      logActivity('Admin Login', `Admin ${user?.email || 'unknown'} logged in.`);
    } else {
      alert("Incorrect password.");
    }
  };

  const handleSaveMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    const newMember: Partial<Member> = {
      loginId: formData.get('loginId') as string,
      standNumber: formData.get('standNumber') as string,
      locationDetails: {
        farmName: formData.get('farmName') as string,
        farmSize: formData.get('farmSize') as string,
        deedNumber: formData.get('deedNumber') as string,
        province: formData.get('province') as string,
        constituency: formData.get('constituency') as string,
        ward: formData.get('ward') as string,
        pollingStation: formData.get('pollingStation') as string,
        district: formData.get('district') as string,
        branch: formData.get('branch') as string,
        cellVillage: formData.get('cellVillage') as string,
      },
      ownershipStatus: {
        status: formData.get('ownershipStatus') as string,
        disputeExplanation: formData.get('disputeExplanation') as string,
      },
      allocationHistory: {
        allocator: formData.get('allocator') as string,
        allocatorName: formData.get('allocatorName') as string,
        amountPaid: formData.get('allocAmount') as string,
      },
      developmentHistory: {
        initiator: formData.get('devInitiator') as string,
        developerName: formData.get('developerName') as string,
        amountPaid: formData.get('devAmount') as string,
        isDone: formData.get('devStatus') as string,
        developmentDone: formData.get('devDoneDetails') as string,
      },
      adminOrgan: {
        type: formData.get('adminType') as string,
        name: formData.get('adminName') as string,
        regNumber: formData.get('adminReg') as string,
        address: formData.get('adminAddress') as string,
        contactNumbers: formData.get('adminContacts') as string,
      },
      beneficiary: {
        standNumber: formData.get('bStandNo') as string,
        standSize: formData.get('bStandSize') as string,
        fullNames: formData.get('bNames') as string,
        idNumber: formData.get('bId') as string,
        dob: formData.get('bDob') as string,
        gender: formData.get('bGender') as string,
        maritalStatus: formData.get('bMarital') as string,
        contactNumber: formData.get('bContact') as string,
        isEmployed: formData.get('bEmployed') as string,
        education: formData.get('bEducation') as string,
      },
      spouse: {
        fullNames: formData.get('spouseNames') as string,
        idNumber: formData.get('spouseId') as string,
        dob: formData.get('spouseDob') as string,
        gender: formData.get('spouseGender') as string,
        contactNumber: formData.get('spouseContact') as string,
        isEmployed: formData.get('spouseEmployed') as string,
      },
      children: {
        fullNames: formData.get('hNames') as string,
        idNumber: formData.get('hId') as string,
        dob: formData.get('hDob') as string,
        gender: formData.get('hGender') as string,
        contactNumber: formData.get('hContact') as string,
        isEmployed: formData.get('hEmployed') as string,
      },
      dependants: {
        fullNames: formData.get('iNames') as string,
        idNumber: formData.get('iId') as string,
        dob: formData.get('iDob') as string,
        gender: formData.get('iGender') as string,
        contactNumber: formData.get('iContact') as string,
        relationship: formData.get('iRelationship') as string,
      },
      stateOfDevelopment: {
        structure: formData.get('jStructure') as string,
        waterSource: formData.get('jWater') as string,
        wasteDisposal: formData.get('jWaste') as string,
        lightingEnergy: formData.get('jLighting') as string,
      },
      infrastructure: {
        roads: formData.get('kRoads') as string,
        drainage: formData.get('kDrainage') as string,
        booster: formData.get('kBooster') as string,
        internet: formData.get('kInternet') as string,
      },
      educationInfra: {
        eceAvailable: formData.get('lEce') as string,
        crecheName: formData.get('lCreche') as string,
        distance: formData.get('lDistance') as string,
      },
      healthInfra: {
        facilityType: formData.get('mFacilityType') as string,
        facilityName: formData.get('mFacilityName') as string,
        distance: formData.get('mDistance') as string,
      },
      goodsSupply: {
        foodSource: formData.get('nFoodSource') as string,
        constSource: formData.get('nConstSource') as string,
      },
      religion: {
        religion: formData.get('oReligion') as string,
        denomination: formData.get('oDenomination') as string,
      },
      tenant: {
        fullNames: formData.get('pNames') as string,
        idNumber: formData.get('pId') as string,
        dob: formData.get('pDob') as string,
        gender: formData.get('pGender') as string,
        contactNumber: formData.get('pContact') as string,
        isEmployed: formData.get('pEmployed') as string,
      },
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingMember?.id) {
        await updateDoc(doc(db, 'members', editingMember.id), newMember);
        logActivity('Update Member', `Updated member ${newMember.beneficiary?.fullNames}`);
      } else {
        // Check for duplicates
        const q = query(collection(db, 'members'), where('standNumber', '==', newMember.standNumber));
        const q2 = query(collection(db, 'members'), where('beneficiary.idNumber', '==', newMember.beneficiary?.idNumber));
        const [s1, s2] = await Promise.all([getDocs(q), getDocs(q2)]);
        
        if (!s1.empty || !s2.empty) {
          alert("Duplicate Stand Number or ID Number detected. Please edit the existing record.");
          setIsSubmitting(false);
          return;
        }

        await addDoc(collection(db, 'members'), {
          ...newMember,
          createdAt: serverTimestamp(),
        });
        logActivity('Register Member', `Registered new member ${newMember.beneficiary?.fullNames}`);
      }
      setEditingMember(null);
      setActiveTab('members');
      alert("Member saved successfully!");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'members');
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportData = () => {
    const headers = ["Full Name", "ID Number", "Stand Number", "Farm Name", "Province", "Gender", "Employed"];
    const rows = members.map(m => [
      m.beneficiary?.fullNames,
      m.beneficiary?.idNumber,
      m.standNumber,
      m.locationDetails?.farmName,
      m.locationDetails?.province,
      m.beneficiary?.gender,
      m.beneficiary?.isEmployed
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `DISMS_Members_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Render Helpers ---

  if (showSplash) return <SplashScreen onComplete={() => setShowSplash(false)} />;

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-sans selection:bg-orange-100 selection:text-orange-900">
      {/* --- Navigation --- */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-orange-200">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none tracking-tight">DISMS AI</h1>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mt-0.5">Digital Management System</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div 
            onClick={() => setIsAdminMode(!isAdminMode)}
            className="w-4 h-4 cursor-default opacity-0 hover:opacity-10 transition-opacity"
            title="Admin Access"
          />
          {isAdminAuthenticated && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-slate-600 hidden sm:block">{user?.email}</span>
              <button 
                onClick={() => {
                  setIsAdminAuthenticated(false);
                  setIsAdminMode(false);
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-semibold transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        <AnimatePresence mode="wait">
          {!isAdminAuthenticated ? (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Left Column: Info & Search */}
              <div className="lg:col-span-7 space-y-8">
                <section>
                  <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                    Riverside Residents <br />
                    <span className="text-orange-600">Association Trust</span>
                  </h2>
                  <p className="mt-4 text-slate-600 text-lg max-w-xl leading-relaxed">
                    Welcome to the Digital Informal Settlement Management System (DISMS AI). 
                    We provide secure, real-time information for our residents.
                  </p>
                </section>

                <section className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-orange-100 text-orange-600 rounded-xl">
                      <Search className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold">Search Portal</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">ID Number</label>
                        <input 
                          type="text" 
                          value={searchId}
                          onChange={(e) => setSearchId(e.target.value)}
                          placeholder="Enter ID Number"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Stand Number</label>
                        <input 
                          type="text" 
                          value={searchStand}
                          onChange={(e) => setSearchStand(e.target.value)}
                          placeholder="Enter Stand Number"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
                        />
                      </div>
                    </div>
                    <button 
                      onClick={handleSearch}
                      className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg shadow-slate-200 transition-all flex items-center justify-center gap-2 group"
                    >
                      Verify Identity
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>

                  {searchError && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm flex gap-3"
                    >
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <p className="font-medium leading-relaxed">{searchError}</p>
                    </motion.div>
                  )}

                  {searchResult && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-8 p-6 bg-emerald-50 border border-emerald-100 rounded-2xl"
                    >
                      <div className="flex items-center gap-3 mb-4 text-emerald-700">
                        <CheckCircle2 className="w-6 h-6" />
                        <h4 className="font-bold text-lg">Identity Verified</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-y-4 text-sm">
                        <div>
                          <p className="text-emerald-600/70 font-bold uppercase text-[10px] tracking-widest">Full Name</p>
                          <p className="font-bold text-slate-900">{searchResult.beneficiary.fullNames}</p>
                        </div>
                        <div>
                          <p className="text-emerald-600/70 font-bold uppercase text-[10px] tracking-widest">Stand Number</p>
                          <p className="font-bold text-slate-900">{searchResult.standNumber}</p>
                        </div>
                        <div>
                          <p className="text-emerald-600/70 font-bold uppercase text-[10px] tracking-widest">Farm Name</p>
                          <p className="font-bold text-slate-900">{searchResult.locationDetails.farmName}</p>
                        </div>
                        <div>
                          <p className="text-emerald-600/70 font-bold uppercase text-[10px] tracking-widest">Status</p>
                          <p className="font-bold text-slate-900">{searchResult.ownershipStatus.status}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </section>
              </div>

              {/* Right Column: Map & Admin Login */}
              <div className="lg:col-span-5 space-y-8">
                <section className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-900">Your Location</h3>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live</span>
                    </div>
                  </div>
                  <MapPlaceholder lat={location?.lat || null} lng={location?.lng || null} />
                  <p className="mt-4 text-xs text-slate-500 leading-relaxed italic">
                    * Your current location is being recorded for settlement verification purposes.
                  </p>
                </section>

                {isAdminMode && (
                  <motion.section 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-slate-900 p-8 rounded-3xl text-white shadow-2xl shadow-slate-400"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <Lock className="w-6 h-6 text-orange-500" />
                      <h3 className="text-xl font-bold">Admin Portal</h3>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Access Key</label>
                        <input 
                          type="password" 
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          placeholder="Enter Password"
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        />
                      </div>
                      <button 
                        onClick={handleAdminLogin}
                        className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl shadow-lg shadow-orange-900/20 transition-all"
                      >
                        Authenticate
                      </button>
                    </div>
                  </motion.section>
                )}

                <footer className="pt-8 border-t border-slate-200">
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-slate-400 font-medium">Created by <span className="text-slate-600 font-bold">Marx Muronzi</span></p>
                    <p className="text-xs text-slate-400 font-medium">Tested by <span className="text-slate-600 font-bold">Mugove Muronzi</span></p>
                  </div>
                </footer>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="admin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {/* Admin Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Admin Dashboard</h2>
                  <p className="text-slate-500 text-sm font-medium">Manage residents, view analytics, and track history.</p>
                </div>
                <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                  {[
                    { id: 'dashboard', icon: BarChart3, label: 'Stats' },
                    { id: 'members', icon: Users, label: 'Members' },
                    { id: 'register', icon: Plus, label: 'Add New' },
                    { id: 'history', icon: HistoryIcon, label: 'Logs' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id as any);
                        if (tab.id !== 'register') setEditingMember(null);
                      }}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
                        activeTab === tab.id 
                          ? "bg-slate-900 text-white shadow-md" 
                          : "text-slate-500 hover:bg-slate-50"
                      )}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Area */}
              <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden min-h-[600px]">
                {activeTab === 'dashboard' && (
                  <div className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      {[
                        { label: 'Total Members', value: members.length, icon: Users, color: 'bg-blue-500' },
                        { label: 'Employment Rate', value: `${Math.round((members.filter(m => m.beneficiary.isEmployed === 'YES').length / members.length || 0) * 100)}%`, icon: Briefcase, color: 'bg-orange-500' },
                        { label: 'Male Residents', value: members.filter(m => m.beneficiary.gender === 'MALE').length, icon: User, color: 'bg-indigo-500' },
                        { label: 'Female Residents', value: members.filter(m => m.beneficiary.gender === 'FEMALE').length, icon: User, color: 'bg-pink-500' }
                      ].map((stat, i) => (
                        <div key={i} className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg", stat.color)}>
                            <stat.icon className="w-5 h-5" />
                          </div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                          <p className="text-2xl font-black text-slate-900 mt-1">{stat.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="bg-white p-6 rounded-2xl border border-slate-100">
                        <h4 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-orange-500" />
                          Registration Growth
                        </h4>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={history.filter(h => h.action === 'Register Member').slice(0, 10).reverse()}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="timestamp" hide />
                              <YAxis hide />
                              <Tooltip />
                              <Line type="monotone" dataKey="id" stroke="#f97316" strokeWidth={3} dot={{ r: 4, fill: '#f97316' }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-2xl border border-slate-100">
                        <h4 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-500" />
                          Gender Distribution
                        </h4>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: 'Male', value: members.filter(m => m.beneficiary.gender === 'MALE').length },
                                  { name: 'Female', value: members.filter(m => m.beneficiary.gender === 'FEMALE').length }
                                ]}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                <Cell fill="#6366f1" />
                                <Cell fill="#ec4899" />
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-100 mt-8">
                      <h4 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <HistoryIcon className="w-4 h-4 text-orange-500" />
                        Recent Activities
                      </h4>
                      <div className="space-y-4">
                        {history.slice(0, 5).map((log) => (
                          <div key={log.id} className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                              <Activity className="w-4 h-4 text-slate-600" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{log.action}</p>
                              <p className="text-xs text-slate-500">{log.details}</p>
                              <p className="text-[10px] text-slate-400 mt-1 font-medium">{log.userEmail} • {log.timestamp ? format(log.timestamp.toDate(), 'MMM d, HH:mm') : 'Just now'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'members' && (
                  <div className="p-0">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <h4 className="font-bold text-slate-900">Member Directory</h4>
                      <button 
                        onClick={exportData}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                      >
                        <Download className="w-4 h-4" />
                        Export CSV
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <th className="px-6 py-4">Full Name</th>
                            <th className="px-6 py-4">ID / Stand</th>
                            <th className="px-6 py-4">Location</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {members.map((member) => (
                            <tr key={member.id} className="hover:bg-slate-50/50 transition-colors group">
                              <td className="px-6 py-4">
                                <p className="font-bold text-slate-900">{member.beneficiary.fullNames}</p>
                                <p className="text-[10px] text-slate-400 font-medium">{member.beneficiary.gender} • {member.beneficiary.maritalStatus}</p>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-xs font-bold text-slate-700">{member.beneficiary.idNumber}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Stand: {member.standNumber}</p>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-xs font-medium text-slate-600">{member.locationDetails.farmName}</p>
                                <p className="text-[10px] text-slate-400">{member.locationDetails.province}</p>
                              </td>
                              <td className="px-6 py-4">
                                <span className={cn(
                                  "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                  member.ownershipStatus.status === 'PRIVATE' ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
                                )}>
                                  {member.ownershipStatus.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button 
                                    onClick={() => {
                                      setEditingMember(member);
                                      setActiveTab('register');
                                    }}
                                    className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteMember(member.id!, member.beneficiary.fullNames)}
                                    className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === 'register' && (
                  <div className="p-8">
                    <form onSubmit={handleSaveMember} className="space-y-12">
                      {/* Section: Login Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-900 rounded-2xl text-white">
                        <div className="md:col-span-2 flex items-center gap-2 mb-2">
                          <Lock className="w-4 h-4 text-orange-500" />
                          <h5 className="text-sm font-bold uppercase tracking-widest">Login Credentials</h5>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Login ID Number</label>
                          <input required name="loginId" defaultValue={editingMember?.loginId} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Stand Number</label>
                          <input required name="standNumber" defaultValue={editingMember?.standNumber} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" />
                        </div>
                      </div>

                      {/* Section A: Location Details */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                          <MapPin className="w-5 h-5 text-orange-600" />
                          <h5 className="font-bold text-slate-900 uppercase tracking-tight">A. Location Details</h5>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {[
                            { name: 'farmName', label: 'Name of Farm' },
                            { name: 'farmSize', label: 'Farm Size' },
                            { name: 'deedNumber', label: 'Deed of Transfer Number' },
                            { name: 'province', label: 'Province' },
                            { name: 'constituency', label: 'Constituency' },
                            { name: 'ward', label: 'Ward' },
                            { name: 'pollingStation', label: 'Polling Station' },
                            { name: 'district', label: 'District' },
                            { name: 'branch', label: 'Branch' },
                            { name: 'cellVillage', label: 'Cell/Village' }
                          ].map((field) => (
                            <div key={field.name}>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{field.label}</label>
                              <input name={field.name} defaultValue={(editingMember?.locationDetails as any)?.[field.name]} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Section B & C: Ownership & Allocation */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-6">
                          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                            <Shield className="w-5 h-5 text-orange-600" />
                            <h5 className="font-bold text-slate-900 uppercase tracking-tight">B. Farm Ownership Status</h5>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Status</label>
                            <select name="ownershipStatus" defaultValue={editingMember?.ownershipStatus.status} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                              <option value="STATE">STATE</option>
                              <option value="COUNCIL">COUNCIL</option>
                              <option value="PRIVATE">PRIVATE</option>
                              <option value="DISPUTED">DISPUTED</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">If disputed, explain</label>
                            <textarea name="disputeExplanation" defaultValue={editingMember?.ownershipStatus.disputeExplanation} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none h-20" />
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                            <Calendar className="w-5 h-5 text-orange-600" />
                            <h5 className="font-bold text-slate-900 uppercase tracking-tight">C. Allocation History</h5>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Allocator</label>
                            <input name="allocator" defaultValue={editingMember?.allocationHistory.allocator} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Name of Allocator</label>
                            <input name="allocatorName" defaultValue={editingMember?.allocationHistory.allocatorName} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Amount Paid</label>
                            <input name="allocAmount" defaultValue={editingMember?.allocationHistory.amountPaid} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                          </div>
                        </div>
                      </div>

                      {/* Section D & E: Development & Admin */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-6">
                          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                            <Activity className="w-5 h-5 text-orange-600" />
                            <h5 className="font-bold text-slate-900 uppercase tracking-tight">D. Development History</h5>
                          </div>
                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Development Initiator</label>
                              <input name="devInitiator" defaultValue={editingMember?.developmentHistory.initiator} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Name of Developer</label>
                              <input name="developerName" defaultValue={editingMember?.developmentHistory.developerName} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Amount Paid</label>
                                <input name="devAmount" defaultValue={editingMember?.developmentHistory.amountPaid} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Is Development Done?</label>
                                <select name="devStatus" defaultValue={editingMember?.developmentHistory.isDone} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                                  <option value="YES">YES</option>
                                  <option value="NO">NO</option>
                                </select>
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Details of Development Done</label>
                              <textarea name="devDoneDetails" defaultValue={editingMember?.developmentHistory.developmentDone} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none h-20" />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                            <Building2 className="w-5 h-5 text-orange-600" />
                            <h5 className="font-bold text-slate-900 uppercase tracking-tight">E. Administrative Organ</h5>
                          </div>
                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Type of Organ</label>
                              <select name="adminType" defaultValue={editingMember?.adminOrgan.type} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                                <option value="COOPERATIVE">COOPERATIVE</option>
                                <option value="TRUST">TRUST</option>
                                <option value="DEVELOPER">DEVELOPER</option>
                                <option value="OTHER">OTHER</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Name of Organ</label>
                              <input name="adminName" defaultValue={editingMember?.adminOrgan.name} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Registration Number</label>
                              <input name="adminReg" defaultValue={editingMember?.adminOrgan.regNumber} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Address</label>
                              <input name="adminAddress" defaultValue={editingMember?.adminOrgan.address} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Contact Numbers</label>
                              <input name="adminContacts" defaultValue={editingMember?.adminOrgan.contactNumbers} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section F: Beneficiary Details */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                          <User className="w-5 h-5 text-orange-600" />
                          <h5 className="font-bold text-slate-900 uppercase tracking-tight">F. Beneficiary Details</h5>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                          {[
                            { name: 'bStandNo', label: 'Provisional Stand No' },
                            { name: 'bStandSize', label: 'Provisional Stand Size' },
                            { name: 'bNames', label: 'Full Names' },
                            { name: 'bId', label: 'ID Number' },
                            { name: 'bDob', label: 'Date of Birth', type: 'date' },
                            { name: 'bGender', label: 'Gender', type: 'select', options: ['MALE', 'FEMALE'] },
                            { name: 'bMarital', label: 'Marital Status' },
                            { name: 'bContact', label: 'Contact Number' },
                            { name: 'bEmployed', label: 'Employment Status', type: 'select', options: ['YES', 'NO'] },
                            { name: 'bEducation', label: 'Education Level' }
                          ].map((field) => (
                            <div key={field.name}>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{field.label}</label>
                              {field.type === 'select' ? (
                                <select name={field.name} defaultValue={(editingMember?.beneficiary as any)?.[field.name.slice(1).toLowerCase()]} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                                  {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                              ) : (
                                <input type={field.type || 'text'} name={field.name} defaultValue={(editingMember?.beneficiary as any)?.[field.name.slice(1).toLowerCase()]} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Section G: Spouse Details */}
                      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                          <Users className="w-5 h-5 text-orange-600" />
                          <h5 className="font-bold text-slate-900 uppercase tracking-tight">G. Spouse Details</h5>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {[
                            { name: 'sNames', label: 'Full Names', path: 'spouse.fullNames' },
                            { name: 'sId', label: 'ID Number', path: 'spouse.idNumber' },
                            { name: 'sDob', label: 'Date of Birth', type: 'date', path: 'spouse.dob' },
                            { name: 'sGender', label: 'Gender', type: 'select', options: ['MALE', 'FEMALE'], path: 'spouse.gender' },
                            { name: 'sContact', label: 'Contact Number', path: 'spouse.contactNumber' },
                            { name: 'sEmployed', label: 'Employment Status', type: 'select', options: ['YES', 'NO'], path: 'spouse.isEmployed' }
                          ].map((field) => (
                            <div key={field.name}>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{field.label}</label>
                              {field.type === 'select' ? (
                                <select 
                                  name={field.name} 
                                  defaultValue={editingMember ? (field.path.split('.').reduce((o, i) => (o as any)?.[i], editingMember) as string) : undefined}
                                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                >
                                  {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                              ) : (
                                <input 
                                  type={field.type || 'text'} 
                                  name={field.name} 
                                  defaultValue={editingMember ? (field.path.split('.').reduce((o, i) => (o as any)?.[i], editingMember) as string) : undefined}
                                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" 
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </motion.div>

                      {/* Section H: Children Details */}
                      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                          <Users className="w-5 h-5 text-blue-600" />
                          <h5 className="font-bold text-slate-900 uppercase tracking-tight">H. Children Details</h5>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {[
                            { name: 'hNames', label: 'Full Names', path: 'children.fullNames' },
                            { name: 'hId', label: 'ID Number', path: 'children.idNumber' },
                            { name: 'hDob', label: 'Date of Birth', type: 'date', path: 'children.dob' },
                            { name: 'hGender', label: 'Gender', type: 'select', options: ['MALE', 'FEMALE'], path: 'children.gender' },
                            { name: 'hContact', label: 'Contact Number', path: 'children.contactNumber' },
                            { name: 'hEmployed', label: 'Employment Status', type: 'select', options: ['YES', 'NO'], path: 'children.isEmployed' }
                          ].map((field) => (
                            <div key={field.name}>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{field.label}</label>
                              {field.type === 'select' ? (
                                <select 
                                  name={field.name} 
                                  defaultValue={editingMember ? (field.path.split('.').reduce((o, i) => (o as any)?.[i], editingMember) as string) : undefined}
                                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                >
                                  {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                              ) : (
                                <input 
                                  type={field.type || 'text'} 
                                  name={field.name} 
                                  defaultValue={editingMember ? (field.path.split('.').reduce((o, i) => (o as any)?.[i], editingMember) as string) : undefined}
                                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" 
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </motion.div>

                      {/* Section I: Dependant Details */}
                      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                          <Users className="w-5 h-5 text-purple-600" />
                          <h5 className="font-bold text-slate-900 uppercase tracking-tight">I. Dependant Details</h5>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {[
                            { name: 'iNames', label: 'Full Names', path: 'dependants.fullNames' },
                            { name: 'iId', label: 'ID Number', path: 'dependants.idNumber' },
                            { name: 'iDob', label: 'Date of Birth', type: 'date', path: 'dependants.dob' },
                            { name: 'iGender', label: 'Gender', type: 'select', options: ['MALE', 'FEMALE'], path: 'dependants.gender' },
                            { name: 'iContact', label: 'Contact Number', path: 'dependants.contactNumber' },
                            { name: 'iRelationship', label: 'Relationship to Owner', path: 'dependants.relationship' }
                          ].map((field) => (
                            <div key={field.name}>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{field.label}</label>
                              {field.type === 'select' ? (
                                <select 
                                  name={field.name} 
                                  defaultValue={editingMember ? (field.path.split('.').reduce((o, i) => (o as any)?.[i], editingMember) as string) : undefined}
                                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                >
                                  {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                              ) : (
                                <input 
                                  type={field.type || 'text'} 
                                  name={field.name} 
                                  defaultValue={editingMember ? (field.path.split('.').reduce((o, i) => (o as any)?.[i], editingMember) as string) : undefined}
                                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" 
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </motion.div>

                      {/* Section J: State of Development */}
                      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                          <FileText className="w-5 h-5 text-orange-600" />
                          <h5 className="font-bold text-slate-900 uppercase tracking-tight">J. State of Development</h5>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Erected Structure</label>
                            <select name="jStructure" defaultValue={editingMember?.stateOfDevelopment.structure} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                              <option value="CABIN">CABIN</option>
                              <option value="COTTAGE">COTTAGE</option>
                              <option value="MAIN HOUSE">MAIN HOUSE</option>
                              <option value="N/A">N/A</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Source of Water</label>
                            <select name="jWater" defaultValue={editingMember?.stateOfDevelopment.waterSource} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                              <option value="MUNICIPAL">MUNICIPAL</option>
                              <option value="OPEN WELL">OPEN WELL</option>
                              <option value="BOREHOLE">BOREHOLE</option>
                              <option value="COMMUNITY BOREHOLE">COMMUNITY BOREHOLE</option>
                              <option value="N/A">N/A</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Waste Disposal</label>
                            <select name="jWaste" defaultValue={editingMember?.stateOfDevelopment.wasteDisposal} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                              <option value="MUNICIPAL">MUNICIPAL</option>
                              <option value="SEPTIC SYSTEM">SEPTIC SYSTEM</option>
                              <option value="PIT LATRINE">PIT LATRINE</option>
                              <option value="BUSH SYSTEM">BUSH SYSTEM</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Lighting Energy</label>
                            <select name="jLighting" defaultValue={editingMember?.stateOfDevelopment.lightingEnergy} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                              <option value="ZESA">ZESA</option>
                              <option value="SOLAR SYSTEM">SOLAR SYSTEM</option>
                              <option value="OIL LAMPS">OIL LAMPS</option>
                              <option value="CANDLES">CANDLES</option>
                              <option value="OTHER">OTHER</option>
                            </select>
                          </div>
                        </div>
                      </motion.div>

                      {/* Section L: Educational Infrastructure */}
                      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                          <GraduationCap className="w-5 h-5 text-blue-600" />
                          <h5 className="font-bold text-slate-900 uppercase tracking-tight">L. Educational Infrastructure</h5>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Local Early Childhood Education</label>
                            <select name="lEce" defaultValue={editingMember?.educationInfra.eceAvailable} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                              <option value="Available">Available</option>
                              <option value="Not Available">Not Available</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Name of Crèche</label>
                            <input name="lCreche" defaultValue={editingMember?.educationInfra.crecheName} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Distance</label>
                            <input name="lDistance" defaultValue={editingMember?.educationInfra.distance} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                          </div>
                        </div>
                      </motion.div>

                      {/* Section M: Health Infrastructure */}
                      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                          <AlertCircle className="w-5 h-5 text-red-600" />
                          <h5 className="font-bold text-slate-900 uppercase tracking-tight">M. Health Infrastructure</h5>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Local Health Care Facility</label>
                            <select name="mFacilityType" defaultValue={editingMember?.healthInfra.facilityType} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                              <option value="Public Clinic">Public Clinic</option>
                              <option value="Private Clinic">Private Clinic</option>
                              <option value="Hospital">Hospital</option>
                              <option value="N/A">N/A</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Name of Facility</label>
                            <input name="mFacilityName" defaultValue={editingMember?.healthInfra.facilityName} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Distance</label>
                            <input name="mDistance" defaultValue={editingMember?.healthInfra.distance} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                          </div>
                        </div>
                      </motion.div>

                      {/* Section N: Local Goods Supply System */}
                      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                          <Briefcase className="w-5 h-5 text-emerald-600" />
                          <h5 className="font-bold text-slate-900 uppercase tracking-tight">N. Local Goods Supply System</h5>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Source of Basic Food & Goods</label>
                            <select name="nFoodSource" defaultValue={editingMember?.goodsSupply.foodSource} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                              <option value="Vendors">Vendors</option>
                              <option value="Tuckshops">Tuckshops</option>
                              <option value="Registered Stores">Registered Stores</option>
                              <option value="N/A">N/A</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Source of Construction Material</label>
                            <select name="nConstSource" defaultValue={editingMember?.goodsSupply.constSource} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                              <option value="Vendors">Vendors</option>
                              <option value="Hardware Tuckshops">Hardware Tuckshops</option>
                              <option value="Registered Hardwares">Registered Hardwares</option>
                              <option value="N/A">N/A</option>
                            </select>
                          </div>
                        </div>
                      </motion.div>

                      {/* Section K: Local Infrastructure */}
                      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                          <BarChart3 className="w-5 h-5 text-indigo-600" />
                          <h5 className="font-bold text-slate-900 uppercase tracking-tight">K. Local Infrastructure</h5>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Cellular Network Booster</label>
                            <select name="kBooster" defaultValue={editingMember?.infrastructure.booster} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                              <option value="Econet">Econet</option>
                              <option value="NetOne">NetOne</option>
                              <option value="Telecel">Telecel</option>
                              <option value="Multiple">Multiple</option>
                              <option value="N/A">N/A</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Internet Hub Provider</label>
                            <select name="kInternet" defaultValue={editingMember?.infrastructure.internet} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                              <option value="Government">Government</option>
                              <option value="Council">Council</option>
                              <option value="Private">Private</option>
                              <option value="Community">Community</option>
                              <option value="N/A">N/A</option>
                            </select>
                          </div>
                        </div>
                      </motion.div>

                      {/* Section O: Religion */}
                      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          <h5 className="font-bold text-slate-900 uppercase tracking-tight">O. Religion</h5>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Religion</label>
                            <select name="oReligion" defaultValue={editingMember?.religion.religion} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                              <option value="Christianity">Christianity</option>
                              <option value="African Traditional Religion">African Traditional Religion</option>
                              <option value="Hinduism">Hinduism</option>
                              <option value="Muslim">Muslim</option>
                              <option value="Rastafarianism">Rastafarianism</option>
                              <option value="Islam">Islam</option>
                              <option value="Judaism">Judaism</option>
                              <option value="Buddhism">Buddhism</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Denomination (if Christianity)</label>
                            <input name="oDenomination" defaultValue={editingMember?.religion.denomination} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                          </div>
                        </div>
                      </motion.div>

                      {/* Section P: Tenant Details */}
                      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                          <Users className="w-5 h-5 text-slate-600" />
                          <h5 className="font-bold text-slate-900 uppercase tracking-tight">P. Tenant Details</h5>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {[
                            { name: 'pNames', label: 'Full Names', path: 'tenant.fullNames' },
                            { name: 'pId', label: 'ID Number', path: 'tenant.idNumber' },
                            { name: 'pDob', label: 'Date of Birth', type: 'date', path: 'tenant.dob' },
                            { name: 'pGender', label: 'Gender', type: 'select', options: ['MALE', 'FEMALE'], path: 'tenant.gender' },
                            { name: 'pContact', label: 'Contact Number', path: 'tenant.contactNumber' },
                            { name: 'pEmployed', label: 'Employment Status', type: 'select', options: ['YES', 'NO'], path: 'tenant.isEmployed' }
                          ].map((field) => (
                            <div key={field.name}>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{field.label}</label>
                              {field.type === 'select' ? (
                                <select 
                                  name={field.name} 
                                  defaultValue={editingMember ? (field.path.split('.').reduce((o, i) => (o as any)?.[i], editingMember) as string) : undefined}
                                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                >
                                  {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                              ) : (
                                <input 
                                  type={field.type || 'text'} 
                                  name={field.name} 
                                  defaultValue={editingMember ? (field.path.split('.').reduce((o, i) => (o as any)?.[i], editingMember) as string) : undefined}
                                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" 
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </motion.div>

                      <div className="pt-8 border-t border-slate-100 flex justify-end gap-4">
                        <button 
                          type="button"
                          onClick={() => {
                            setActiveTab('members');
                            setEditingMember(null);
                          }}
                          className="px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit"
                          disabled={isSubmitting}
                          className="px-12 py-4 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl shadow-lg shadow-orange-200 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                          {isSubmitting ? 'Saving...' : (
                            <>
                              <Save className="w-5 h-5" />
                              {editingMember ? 'Update Member' : 'Save in Cloud Space'}
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {activeTab === 'history' && (
                  <div className="p-0">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                      <h4 className="font-bold text-slate-900">System Activity Logs</h4>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {history.map((log) => (
                        <div key={log.id} className="p-6 hover:bg-slate-50/50 transition-colors flex items-start gap-4">
                          <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                            <HistoryIcon className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-xs font-bold text-slate-900">{log.action}</p>
                              <p className="text-[10px] text-slate-400 font-medium">
                                {log.timestamp ? format(log.timestamp.toDate(), 'MMM d, yyyy HH:mm') : 'Pending...'}
                              </p>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">{log.details}</p>
                            <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-tighter">User: {log.userEmail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Hidden Admin Access */}
      <div 
        onClick={() => setIsAdminMode(!isAdminMode)}
        className="fixed bottom-0 left-0 w-12 h-12 cursor-default opacity-0 hover:opacity-10 transition-opacity z-50"
        title="Admin Access"
      />
    </div>
  );
}
