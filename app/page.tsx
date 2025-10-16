'use client';

import { useState } from 'react';
// RESTORING EXTERNAL IMPORTS FOR NEXT.JS PRODUCTION ENVIRONMENT
import { db } from '../lib/firebaseClient'; 
import {
  doc,
  collection,
  getDocs,
  updateDoc,
  serverTimestamp,
  Timestamp,
  query,
  where,
} from 'firebase/firestore';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Image from 'next/image'; 

type Photo = {
  url: string;
  timestamp: Timestamp;
  originalName: string; 
};

type Student = {
  firstName: string;
  lastName: string;
  chosenPhotoUrl?: string;
  chosenPhotoName?: string | null;
  hasChosen?: boolean;
  uniquecode: string; // The field used for access/lookup
};

type Message = {
    type: 'success' | 'error';
    text: string;
    show: boolean;
}

export default function YearbookPickerPage() {
  const [code, setCode] = useState('');
  const [student, setStudent] = useState<Student | null>(null);
  // Stores the actual Firestore Document ID (the naturalKey) after a successful unique code lookup
  const [studentDocId, setStudentDocId] = useState<string | null>(null); 
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState<Message>({ type: 'success', text: '', show: false });

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text, show: true });
    setTimeout(() => setMessage({ type, text: '', show: false }), 4000);
  };

  const fetchStudentData = async () => {
    setError('');
    setStudent(null);
    setPhotos([]);
    setStudentDocId(null);
    setMessage({ type: 'success', text: '', show: false });
    
    const trimmedCode = code.trim();
    if (!trimmedCode) {
        setError("Please enter a code.");
        return;
    }

    setLoading(true);
    try {
      const studentsRef = collection(db, 'students');
      
      // CRITICAL STEP 1: Query the 'students' collection using the 'uniquecode' field
      const q = query(studentsRef, where('uniquecode', '==', trimmedCode));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('Invalid code. Please check your personalized yearbook key.');
        setLoading(false);
        return;
      }
      
      // CRITICAL STEP 2: Get the document snapshot and extract the actual Document ID (natural key)
      const studentSnap = querySnapshot.docs[0];
      const docId = studentSnap.id;
      setStudentDocId(docId); 

      const studentData = studentSnap.data() as Student;
      setStudent(studentData);

      // STEP 3: Use the snapshot reference to fetch the subcollection
      const photosCol = collection(studentSnap.ref, 'photos');
      const photosSnap = await getDocs(photosCol);
      const photosList: Photo[] = photosSnap.docs
        .map((doc) => doc.data() as Photo)
        .sort((a, b) => a.timestamp.seconds - b.timestamp.seconds);
      setPhotos(photosList);

      // Pre-select logic
      if (studentData.hasChosen && studentData.chosenPhotoUrl) {
        setSelected(studentData.chosenPhotoUrl);
      } else if (photosList.length > 0) {
        setSelected(photosList[0].url); 
      }
      
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred while fetching data.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    // Ensure we have the retrieved Document ID (studentDocId) for the update
    if (!student || !selected || !studentDocId) return; 
    setLoading(true);

    try {
      const chosenPhoto = photos.find((p) => p.url === selected);

      // CRITICAL STEP 4: Use the Document ID (naturalKey) for the direct update
      const studentRef = doc(db, 'students', studentDocId); 
      await updateDoc(studentRef, {
        chosenPhotoUrl: selected,
        chosenPhotoName: chosenPhoto?.originalName ?? null, 
        hasChosen: true,
        choiceTimestamp: serverTimestamp(),
      });

      showMessage('success', '✅ Photo confirmed! Your choice has been saved.');
      
      // Update local state
      setStudent({
        ...student,
        chosenPhotoUrl: selected,
        chosenPhotoName: chosenPhoto?.originalName ?? null, 
        hasChosen: true,
      });

    } catch (err) {
      console.error(err);
      showMessage('error', '❌ Error updating selection. Please try again.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="w-screen min-h-screen flex flex-col items-center bg-gradient-to-b from-white to-zinc-50 p-6 font-sans">
        
      {/* Notification Message */}
      <div 
        className={`fixed top-4 w-11/12 md:w-auto p-4 rounded-lg shadow-lg z-50 transition-transform duration-300 ${message.show ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0'} ${message.type === 'success' ? 'bg-green-100 border border-green-400 text-green-700' : 'bg-red-100 border border-red-400 text-red-700'}`}
      >
        {message.type === 'success' ? (
            <CheckCircle className="inline w-5 h-5 mr-2" />
        ) : (
            <XCircle className="inline w-5 h-5 mr-2" />
        )}
        {message.text}
      </div>


      <div
        className="flex flex-col md:flex-row w-full bg-white p-6 md:p-8 rounded-2xl shadow-xl border-t-4 border-green-600"
        style={{
          maxWidth: '1200px',
          gap: '32px',
        }}
      >
        {/* Left Column - Code Input / Selected Photo */}
        <div className="flex-1 flex flex-col justify-start items-center md:items-start">
          <h1 className="font-extrabold text-center mx-auto md:mx-0 text-3xl md:text-4xl mb-6 text-green-800">
            Yearbook Photo Selector
          </h1>
          
          {student && (
              <p className="text-xl font-medium text-gray-700 mb-4">
                  Welcome, <span className="font-bold text-green-800">{student.firstName} {student.lastName}</span>
              </p>
          )}

          <div className="bg-gray-50 rounded-2xl flex flex-col items-center w-full relative p-6 border-2 border-green-200 shadow-inner">
            {!student ? (
              <div className="flex flex-col items-center gap-4 w-full">
                <input
                  type="text"
                  placeholder="Enter your student code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="border-2 border-green-500 rounded-xl px-4 py-3 w-full max-w-sm text-center text-lg font-mono focus:ring-green-600 focus:border-green-600 transition duration-150"
                  onKeyDown={(e) => { if (e.key === 'Enter') fetchStudentData(); }}
                  autoComplete="off"
                />
                <button
                  onClick={fetchStudentData}
                  className="bg-green-600 text-white w-full max-w-sm px-6 py-3 rounded-full font-semibold text-lg hover:bg-green-700 transition duration-150 shadow-md disabled:bg-gray-400 flex items-center justify-center"
                  disabled={loading || !code}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                  {loading ? 'Searching...' : 'Search for Photos'}
                </button>
                {error && <p className="text-red-600 mt-2 font-medium">{error}</p>}
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-4 text-green-800">Your Chosen Photo</h2>
                <div className="w-full aspect-[4/5] relative cursor-pointer shadow-xl rounded-xl border-4 border-green-600">
                  {selected ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={selected}
                        alt="Selected photo"
                        fill
                        style={{ objectFit: 'cover', borderRadius: '0.75rem' }}
                        priority
                      />
                      <div className="absolute top-3 right-3 rounded-full p-2 bg-white shadow-2xl flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-center text-green-700 bg-gray-100 rounded-xl">
                      <p className='text-lg font-medium'>Click a photo on the right to select it.</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Column - Gallery + Confirm */}
        {student && (
          <div className="flex-1 flex flex-col gap-6 pt-4 md:pt-0">
            <div className="bg-white rounded-2xl flex flex-col p-6 border-2 border-green-600 shadow-md">
              <h2 className="font-bold mb-4 text-green-800 text-2xl">
                Photo Gallery ({photos.length} Options)
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 overflow-y-auto max-h-[600px] p-2 -m-2">
                {photos.map((photo) => {
                  const isSelected = selected === photo.url;
                  
                  // Determine the border class for better visual feedback
                  const borderClass = isSelected 
                      ? 'border-4 border-green-600 ring-4 ring-green-300 shadow-lg scale-[1.03]'
                      : 'border-2 border-gray-200 hover:border-green-400';

                  return (
                    <div
                      key={photo.url}
                      className={`relative cursor-pointer w-full aspect-[4/5] rounded-xl transition-all duration-200 ${borderClass}`}
                      onClick={() => setSelected(photo.url)}
                    >
                      <Image
                        src={photo.url}
                        alt={`Photo option: ${photo.originalName}`}
                        fill
                        style={{ objectFit: 'cover', borderRadius: '0.65rem' }}
                      />
                      {isSelected && (
                        <div className="absolute top-2 right-2 rounded-full p-1 bg-green-600 shadow-2xl flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                      )}
                      <p className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs text-center p-1 rounded-b-xl truncate">
                          {photo.originalName}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Confirm Button */}
            <div className="bg-white rounded-2xl flex flex-col items-center justify-center p-4 border-2 border-green-600 shadow-md">
              <button
                onClick={handleConfirm}
                className="bg-green-600 text-white px-8 py-3 w-full rounded-full font-bold text-xl transition-all duration-150 active:shadow-inner active:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                disabled={!selected || loading}
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Finalize My Yearbook Photo'}
              </button>
              {student.hasChosen && (
                  <p className="mt-3 text-sm text-gray-500">
                      You have previously made a choice. Submitting again will overwrite it.
                  </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
