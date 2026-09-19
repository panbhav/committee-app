import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { INITIAL_MEMBERS, INITIAL_LOANS } from '../src/data/initialData.js';

const firebaseConfig = {
  apiKey: "AIzaSyBm75cUtXr_fil1G_ebcpP1W4tp4mznCXU",
  authDomain: "committee-app-92a77.firebaseapp.com",
  projectId: "committee-app-92a77",
  storageBucket: "committee-app-92a77.firebasestorage.app",
  messagingSenderId: "695115957454",
  appId: "1:695115957454:web:8b222b915649614dd37c9f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  console.log("Connecting to Firestore...");
  const docRef = doc(db, 'committee', 'global_state');
  const snap = await getDoc(docRef);

  if (snap.exists()) {
    const d = snap.data();
    console.log("\n--- Current Firestore State ---");
    console.log("Loans count:", d.loans?.length);
    console.log("New loans added beyond initial:", d.loans?.filter(l => !INITIAL_LOANS.some(il => il.id === l.id)));
    console.log("Loan Requests count:", d.loanRequests?.length);
    if (d.loanRequests?.length > 0) {
      console.log("Pending Loan Requests:", JSON.stringify(d.loanRequests, null, 2));
    }
  } else {
    console.log("No existing document found in Firestore.");
  }

  // Prepare initial payments
  const initialPayments = {};
  INITIAL_MEMBERS.forEach(m => {
    initialPayments[m.id] = { status: 'pending', shortAmount: 0, extraAmount: 0, deposit: 0, paidAt: null, paidBy: null };
  });

  const initialAuditLogs = [
    {
      id: 'log-sep-3',
      timestamp: '10 Sep 2026, 07:30 PM',
      actor: 'NARENDRA (Admin)',
      action: 'MEETING_OPENED',
      details: 'September 2026 Monthly General Meeting in session at Narendra residence.',
      canRollback: false
    },
    {
      id: 'log-sep-2',
      timestamp: '10 Sep 2026, 06:45 PM',
      actor: 'HARISH (Admin)',
      action: 'FUND_HEALTH_CHECK',
      details: 'Liquidity check verified: ₹1,50,000 opening reserve + ₹5,84,902 expected collections.',
      canRollback: false
    },
    {
      id: 'log-aug-1',
      timestamp: '10 Aug 2026, 08:30 PM',
      actor: 'NARENDRA (Admin)',
      action: 'MEETING_CONCLUDED',
      details: 'August 2026 meeting completed with 100% attendance and ₹5,84,902 recovery.',
      canRollback: false
    }
  ];

  const resetData = {
    members: INITIAL_MEMBERS,
    loans: INITIAL_LOANS,
    payments: initialPayments,
    auditLogs: initialAuditLogs,
    loanRequests: [],
    monthlyUnit: 1000,
    availableCashFund: 150000,
    meetingMonth: 'September 2026',
    meetingDate: '10 Sep 2026',
    version: 'v2-initial',
    lastResetAt: new Date().toISOString()
  };

  console.log("\nResetting Firestore committee/global_state to clean initial data...");
  await setDoc(docRef, resetData);
  console.log("✅ Successfully reset Firestore to initial September data!");

  process.exit(0);
}

run().catch(err => {
  console.error("Error during reset:", err);
  process.exit(1);
});
