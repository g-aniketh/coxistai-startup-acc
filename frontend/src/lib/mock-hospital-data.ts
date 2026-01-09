// Centralized mock data for hospital dummy modules

export interface Patient {
  id: string;
  name: string;
  dateOfBirth: string;
  gender: "Male" | "Female" | "Other";
  phone: string;
  email: string;
  address: string;
  bloodType: string;
  insuranceProvider: string;
  policyNumber: string;
  emergencyContact: string;
  emergencyPhone: string;
  medicalHistory: string[];
  allergies: string[];
  balance: number;
  lastVisit: string;
  status: "Active" | "Inactive" | "Discharged";
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  department: string;
  date: string;
  time: string;
  duration: number; // minutes
  type: "Consultation" | "Follow-up" | "Procedure" | "Emergency" | "Lab Test";
  status: "Scheduled" | "In Progress" | "Completed" | "Cancelled" | "No Show";
  notes: string;
  room: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: "Physician" | "Nurse" | "Technician" | "Admin" | "Support";
  department: string;
  specialization?: string;
  email: string;
  phone: string;
  joinDate: string;
  status: "Active" | "On Leave" | "Inactive";
  shift: "Day" | "Night" | "Rotating";
  credentials?: string[];
}

export interface Facility {
  id: string;
  name: string;
  type: "Ward" | "ICU" | "OT" | "Lab" | "Pharmacy" | "Radiology" | "Emergency" | "OPD";
  totalBeds?: number;
  occupiedBeds?: number;
  floor: string;
  status: "Operational" | "Under Maintenance" | "Closed";
  equipment?: string[];
  contactExtension: string;
}

// Mock Patients Data
export const mockPatients: Patient[] = [
  {
    id: "PT-2024-0542",
    name: "Rajesh Kumar",
    dateOfBirth: "1978-05-12",
    gender: "Male",
    phone: "+91 98765 43210",
    email: "rajesh.kumar@email.com",
    address: "45, MG Road, Bengaluru 560001",
    bloodType: "B+",
    insuranceProvider: "Star Health Insurance",
    policyNumber: "SH-2024-789456",
    emergencyContact: "Priya Kumar (Wife)",
    emergencyPhone: "+91 98765 43211",
    medicalHistory: ["Hypertension", "Type 2 Diabetes"],
    allergies: ["Penicillin"],
    balance: 1600,
    lastVisit: "2025-01-08",
    status: "Active",
  },
  {
    id: "PT-2024-0389",
    name: "Priya Sharma",
    dateOfBirth: "1985-09-23",
    gender: "Female",
    phone: "+91 87654 32109",
    email: "priya.sharma@email.com",
    address: "12, Park Street, Mumbai 400001",
    bloodType: "O+",
    insuranceProvider: "ICICI Lombard",
    policyNumber: "IL-2023-456123",
    emergencyContact: "Amit Sharma (Husband)",
    emergencyPhone: "+91 87654 32110",
    medicalHistory: ["Chronic Back Pain"],
    allergies: [],
    balance: 3000,
    lastVisit: "2025-01-05",
    status: "Active",
  },
  {
    id: "PT-2024-0621",
    name: "Amit Patel",
    dateOfBirth: "1990-03-15",
    gender: "Male",
    phone: "+91 76543 21098",
    email: "amit.patel@email.com",
    address: "78, Gandhi Nagar, Ahmedabad 380001",
    bloodType: "A+",
    insuranceProvider: "Max Bupa",
    policyNumber: "MB-2024-321654",
    emergencyContact: "Meera Patel (Mother)",
    emergencyPhone: "+91 76543 21099",
    medicalHistory: [],
    allergies: ["Sulfa drugs"],
    balance: 0,
    lastVisit: "2025-01-02",
    status: "Active",
  },
  {
    id: "PT-2024-0718",
    name: "Sunita Verma",
    dateOfBirth: "1982-11-08",
    gender: "Female",
    phone: "+91 65432 10987",
    email: "sunita.verma@email.com",
    address: "23, Civil Lines, Delhi 110001",
    bloodType: "AB+",
    insuranceProvider: "HDFC Ergo",
    policyNumber: "HE-2024-159753",
    emergencyContact: "Rahul Verma (Son)",
    emergencyPhone: "+91 65432 10988",
    medicalHistory: ["PCOS", "Anemia"],
    allergies: [],
    balance: 740,
    lastVisit: "2025-01-10",
    status: "Active",
  },
  {
    id: "PT-2024-0456",
    name: "Vikram Singh",
    dateOfBirth: "1975-07-20",
    gender: "Male",
    phone: "+91 54321 09876",
    email: "vikram.singh@email.com",
    address: "56, Sector 18, Noida 201301",
    bloodType: "B-",
    insuranceProvider: "Star Health Insurance",
    policyNumber: "SH-2023-654987",
    emergencyContact: "Kavita Singh (Wife)",
    emergencyPhone: "+91 54321 09877",
    medicalHistory: ["Appendicitis (Removed)"],
    allergies: ["Aspirin"],
    balance: 0,
    lastVisit: "2025-01-03",
    status: "Discharged",
  },
  {
    id: "PT-2024-0892",
    name: "Meera Reddy",
    dateOfBirth: "1988-02-14",
    gender: "Female",
    phone: "+91 43210 98765",
    email: "meera.reddy@email.com",
    address: "89, Banjara Hills, Hyderabad 500034",
    bloodType: "O-",
    insuranceProvider: "Bajaj Allianz",
    policyNumber: "BA-2024-852963",
    emergencyContact: "Suresh Reddy (Father)",
    emergencyPhone: "+91 43210 98766",
    medicalHistory: ["Chronic Migraines"],
    allergies: [],
    balance: 0,
    lastVisit: "2025-01-07",
    status: "Active",
  },
  {
    id: "PT-2024-0234",
    name: "Rohit Kapoor",
    dateOfBirth: "1970-12-05",
    gender: "Male",
    phone: "+91 32109 87654",
    email: "rohit.kapoor@email.com",
    address: "34, Marine Drive, Mumbai 400002",
    bloodType: "A-",
    insuranceProvider: "ICICI Lombard",
    policyNumber: "IL-2024-741258",
    emergencyContact: "Neha Kapoor (Daughter)",
    emergencyPhone: "+91 32109 87655",
    medicalHistory: ["Coronary Artery Disease", "Hypertension"],
    allergies: ["Iodine contrast"],
    balance: 11000,
    lastVisit: "2024-12-28",
    status: "Active",
  },
  {
    id: "PT-2024-0567",
    name: "Anita Desai",
    dateOfBirth: "1965-08-30",
    gender: "Female",
    phone: "+91 21098 76543",
    email: "anita.desai@email.com",
    address: "67, Koramangala, Bengaluru 560034",
    bloodType: "B+",
    insuranceProvider: "Max Bupa",
    policyNumber: "MB-2023-963852",
    emergencyContact: "Vivek Desai (Son)",
    emergencyPhone: "+91 21098 76544",
    medicalHistory: ["Breast Cancer (In Treatment)"],
    allergies: [],
    balance: 7000,
    lastVisit: "2024-12-25",
    status: "Active",
  },
];

// Mock Appointments Data
export const mockAppointments: Appointment[] = [
  {
    id: "APT-001",
    patientId: "PT-2024-0542",
    patientName: "Rajesh Kumar",
    doctorId: "DR-001",
    doctorName: "Dr. Sanjay Mehta",
    department: "Cardiology",
    date: "2025-01-15",
    time: "10:00",
    duration: 30,
    type: "Follow-up",
    status: "Scheduled",
    notes: "Review ECG results",
    room: "Room 204",
  },
  {
    id: "APT-002",
    patientId: "PT-2024-0389",
    patientName: "Priya Sharma",
    doctorId: "DR-002",
    doctorName: "Dr. Ritu Agarwal",
    department: "Orthopedics",
    date: "2025-01-14",
    time: "11:30",
    duration: 45,
    type: "Follow-up",
    status: "Scheduled",
    notes: "Physical therapy progress check",
    room: "Room 108",
  },
  {
    id: "APT-003",
    patientId: "PT-2024-0718",
    patientName: "Sunita Verma",
    doctorId: "DR-003",
    doctorName: "Dr. Prerna Singh",
    department: "Gynecology",
    date: "2025-01-14",
    time: "14:00",
    duration: 30,
    type: "Consultation",
    status: "In Progress",
    notes: "Discuss ultrasound results",
    room: "Room 305",
  },
  {
    id: "APT-004",
    patientId: "PT-2024-0892",
    patientName: "Meera Reddy",
    doctorId: "DR-004",
    doctorName: "Dr. Anil Kumar",
    department: "Neurology",
    date: "2025-01-14",
    time: "15:30",
    duration: 60,
    type: "Procedure",
    status: "Scheduled",
    notes: "MRI Brain follow-up",
    room: "Imaging Center",
  },
  {
    id: "APT-005",
    patientId: "PT-2024-0234",
    patientName: "Rohit Kapoor",
    doctorId: "DR-001",
    doctorName: "Dr. Sanjay Mehta",
    department: "Cardiology",
    date: "2025-01-16",
    time: "09:00",
    duration: 45,
    type: "Follow-up",
    status: "Scheduled",
    notes: "Post-catheterization review",
    room: "Room 204",
  },
  {
    id: "APT-006",
    patientId: "PT-2024-0567",
    patientName: "Anita Desai",
    doctorId: "DR-005",
    doctorName: "Dr. Kavita Nair",
    department: "Oncology",
    date: "2025-01-17",
    time: "10:30",
    duration: 60,
    type: "Consultation",
    status: "Scheduled",
    notes: "Chemotherapy cycle review",
    room: "Oncology Ward",
  },
  {
    id: "APT-007",
    patientId: "PT-2024-0621",
    patientName: "Amit Patel",
    doctorId: "DR-006",
    doctorName: "Dr. Ramesh Gupta",
    department: "General Medicine",
    date: "2025-01-13",
    time: "16:00",
    duration: 20,
    type: "Lab Test",
    status: "Completed",
    notes: "Blood work completed",
    room: "Lab",
  },
  {
    id: "APT-008",
    patientId: "PT-2024-0456",
    patientName: "Vikram Singh",
    doctorId: "DR-007",
    doctorName: "Dr. Suresh Iyer",
    department: "Surgery",
    date: "2025-01-05",
    time: "08:00",
    duration: 120,
    type: "Procedure",
    status: "Completed",
    notes: "Appendectomy successful",
    room: "OT 2",
  },
];

// Mock Staff Data
export const mockStaff: StaffMember[] = [
  {
    id: "DR-001",
    name: "Dr. Sanjay Mehta",
    role: "Physician",
    department: "Cardiology",
    specialization: "Interventional Cardiology",
    email: "sanjay.mehta@hospital.com",
    phone: "+91 98765 00001",
    joinDate: "2018-03-15",
    status: "Active",
    shift: "Day",
    credentials: ["MD", "DM Cardiology", "FACC"],
  },
  {
    id: "DR-002",
    name: "Dr. Ritu Agarwal",
    role: "Physician",
    department: "Orthopedics",
    specialization: "Spine Surgery",
    email: "ritu.agarwal@hospital.com",
    phone: "+91 98765 00002",
    joinDate: "2019-07-20",
    status: "Active",
    shift: "Day",
    credentials: ["MS Ortho", "Fellowship Spine"],
  },
  {
    id: "DR-003",
    name: "Dr. Prerna Singh",
    role: "Physician",
    department: "Gynecology",
    specialization: "High-Risk Pregnancy",
    email: "prerna.singh@hospital.com",
    phone: "+91 98765 00003",
    joinDate: "2017-01-10",
    status: "Active",
    shift: "Day",
    credentials: ["MD OB-GYN", "DNB"],
  },
  {
    id: "DR-004",
    name: "Dr. Anil Kumar",
    role: "Physician",
    department: "Neurology",
    specialization: "Epilepsy",
    email: "anil.kumar@hospital.com",
    phone: "+91 98765 00004",
    joinDate: "2020-05-01",
    status: "Active",
    shift: "Rotating",
    credentials: ["MD", "DM Neurology"],
  },
  {
    id: "DR-005",
    name: "Dr. Kavita Nair",
    role: "Physician",
    department: "Oncology",
    specialization: "Medical Oncology",
    email: "kavita.nair@hospital.com",
    phone: "+91 98765 00005",
    joinDate: "2016-09-15",
    status: "Active",
    shift: "Day",
    credentials: ["MD", "DM Medical Oncology"],
  },
  {
    id: "DR-006",
    name: "Dr. Ramesh Gupta",
    role: "Physician",
    department: "General Medicine",
    specialization: "Internal Medicine",
    email: "ramesh.gupta@hospital.com",
    phone: "+91 98765 00006",
    joinDate: "2015-02-01",
    status: "Active",
    shift: "Rotating",
    credentials: ["MD Internal Medicine"],
  },
  {
    id: "DR-007",
    name: "Dr. Suresh Iyer",
    role: "Physician",
    department: "Surgery",
    specialization: "General Surgery",
    email: "suresh.iyer@hospital.com",
    phone: "+91 98765 00007",
    joinDate: "2014-11-20",
    status: "Active",
    shift: "Rotating",
    credentials: ["MS General Surgery", "FACS"],
  },
  {
    id: "NRS-001",
    name: "Anjali Sharma",
    role: "Nurse",
    department: "ICU",
    email: "anjali.sharma@hospital.com",
    phone: "+91 98765 00101",
    joinDate: "2019-04-10",
    status: "Active",
    shift: "Night",
    credentials: ["BSc Nursing", "ICU Certification"],
  },
  {
    id: "NRS-002",
    name: "Deepa Krishnan",
    role: "Nurse",
    department: "Emergency",
    email: "deepa.krishnan@hospital.com",
    phone: "+91 98765 00102",
    joinDate: "2018-08-15",
    status: "Active",
    shift: "Rotating",
    credentials: ["GNM", "ACLS Certified"],
  },
  {
    id: "NRS-003",
    name: "Rekha Patel",
    role: "Nurse",
    department: "General Ward",
    email: "rekha.patel@hospital.com",
    phone: "+91 98765 00103",
    joinDate: "2020-01-05",
    status: "Active",
    shift: "Day",
    credentials: ["BSc Nursing"],
  },
  {
    id: "TECH-001",
    name: "Rahul Verma",
    role: "Technician",
    department: "Radiology",
    specialization: "CT & MRI",
    email: "rahul.verma@hospital.com",
    phone: "+91 98765 00201",
    joinDate: "2017-06-20",
    status: "Active",
    shift: "Day",
    credentials: ["DMRIT"],
  },
  {
    id: "TECH-002",
    name: "Pooja Nair",
    role: "Technician",
    department: "Lab",
    specialization: "Clinical Pathology",
    email: "pooja.nair@hospital.com",
    phone: "+91 98765 00202",
    joinDate: "2019-03-01",
    status: "Active",
    shift: "Rotating",
    credentials: ["DMLT"],
  },
  {
    id: "ADM-001",
    name: "Sunil Reddy",
    role: "Admin",
    department: "Administration",
    email: "sunil.reddy@hospital.com",
    phone: "+91 98765 00301",
    joinDate: "2016-01-15",
    status: "Active",
    shift: "Day",
  },
  {
    id: "SUP-001",
    name: "Geeta Devi",
    role: "Support",
    department: "Housekeeping",
    email: "geeta.devi@hospital.com",
    phone: "+91 98765 00401",
    joinDate: "2018-05-10",
    status: "Active",
    shift: "Day",
  },
];

// Mock Facilities Data
export const mockFacilities: Facility[] = [
  {
    id: "FAC-001",
    name: "General Ward A",
    type: "Ward",
    totalBeds: 30,
    occupiedBeds: 24,
    floor: "2nd Floor",
    status: "Operational",
    contactExtension: "201",
  },
  {
    id: "FAC-002",
    name: "General Ward B",
    type: "Ward",
    totalBeds: 25,
    occupiedBeds: 18,
    floor: "2nd Floor",
    status: "Operational",
    contactExtension: "202",
  },
  {
    id: "FAC-003",
    name: "ICU",
    type: "ICU",
    totalBeds: 12,
    occupiedBeds: 9,
    floor: "3rd Floor",
    status: "Operational",
    equipment: ["Ventilators", "Cardiac Monitors", "Defibrillators"],
    contactExtension: "301",
  },
  {
    id: "FAC-004",
    name: "NICU",
    type: "ICU",
    totalBeds: 8,
    occupiedBeds: 5,
    floor: "3rd Floor",
    status: "Operational",
    equipment: ["Incubators", "Phototherapy Units", "Infant Monitors"],
    contactExtension: "302",
  },
  {
    id: "FAC-005",
    name: "Operation Theatre 1",
    type: "OT",
    floor: "4th Floor",
    status: "Operational",
    equipment: ["C-Arm", "Laparoscopy Unit", "Anesthesia Station"],
    contactExtension: "401",
  },
  {
    id: "FAC-006",
    name: "Operation Theatre 2",
    type: "OT",
    floor: "4th Floor",
    status: "Operational",
    equipment: ["Cardiac Surgery Setup", "ECMO"],
    contactExtension: "402",
  },
  {
    id: "FAC-007",
    name: "Operation Theatre 3",
    type: "OT",
    floor: "4th Floor",
    status: "Under Maintenance",
    equipment: ["General Surgery Setup"],
    contactExtension: "403",
  },
  {
    id: "FAC-008",
    name: "Clinical Laboratory",
    type: "Lab",
    floor: "Ground Floor",
    status: "Operational",
    equipment: ["Hematology Analyzer", "Biochemistry Analyzer", "Blood Gas Analyzer"],
    contactExtension: "101",
  },
  {
    id: "FAC-009",
    name: "Radiology Department",
    type: "Radiology",
    floor: "1st Floor",
    status: "Operational",
    equipment: ["X-Ray", "CT Scanner", "MRI 3T", "Ultrasound"],
    contactExtension: "102",
  },
  {
    id: "FAC-010",
    name: "Pharmacy",
    type: "Pharmacy",
    floor: "Ground Floor",
    status: "Operational",
    contactExtension: "103",
  },
  {
    id: "FAC-011",
    name: "Emergency Department",
    type: "Emergency",
    totalBeds: 15,
    occupiedBeds: 8,
    floor: "Ground Floor",
    status: "Operational",
    equipment: ["Trauma Bay", "Resuscitation Equipment", "Point-of-Care Testing"],
    contactExtension: "100",
  },
  {
    id: "FAC-012",
    name: "OPD Complex",
    type: "OPD",
    floor: "1st Floor",
    status: "Operational",
    contactExtension: "150",
  },
];

// Helper functions
export const getPatientById = (id: string): Patient | undefined => {
  return mockPatients.find((p) => p.id === id);
};

export const getAppointmentsByPatient = (patientId: string): Appointment[] => {
  return mockAppointments.filter((a) => a.patientId === patientId);
};

export const getAppointmentsByDoctor = (doctorId: string): Appointment[] => {
  return mockAppointments.filter((a) => a.doctorId === doctorId);
};

export const getStaffByDepartment = (department: string): StaffMember[] => {
  return mockStaff.filter((s) => s.department === department);
};

export const getTodaysAppointments = (): Appointment[] => {
  const today = new Date().toISOString().split("T")[0];
  return mockAppointments.filter((a) => a.date === today);
};

export const getOccupancyStats = () => {
  const wards = mockFacilities.filter((f) => f.type === "Ward" || f.type === "ICU");
  const totalBeds = wards.reduce((sum, f) => sum + (f.totalBeds || 0), 0);
  const occupiedBeds = wards.reduce((sum, f) => sum + (f.occupiedBeds || 0), 0);
  return {
    totalBeds,
    occupiedBeds,
    availableBeds: totalBeds - occupiedBeds,
    occupancyRate: ((occupiedBeds / totalBeds) * 100).toFixed(1),
  };
};

