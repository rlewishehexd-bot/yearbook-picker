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
  query, // CRITICAL: Used for secure lookup
  where, // CRITICAL: Used for secure lookup
} from 'firebase/firestore';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import Image from 'next/image';

type Photo = {
  url: string;
  timestamp: Timestamp;
  originalName: string; // The original file name
};

type Student = {
  firstName: string;
  lastName: string;
  chosenPhotoUrl?: string;
  chosenPhotoName?: string | null;
  hasChosen?: boolean;
  uniquecode: string; // The field used for access/lookup
};

export default function YearbookPickerPage() {
  const [code, setCode] = useState('');
  const [student, setStudent] = useState<Student | null>(null);
  // Stores the actual Firestore Document ID (the naturalKey) after a successful unique code lookup
  const [studentDocId, setStudentDocId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(''); // Simple success message state

  const fetchStudentData = async () => {
    setError('');
    setSuccess('');
    setStudent(null);
    setPhotos([]);
    setStudentDocId(null); // Clear ID state

    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setError('Please enter a code.');
      return;
    }

    setLoading(true);
    try {
      const studentsRef = collection(db, 'students');

      // 1. SECURE LOOKUP: Query the 'students' collection using the 'uniquecode' field
      const q = query(studentsRef, where('uniquecode', '==', trimmedCode));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('Invalid code.');
        return; // Exit early if no match
      }

      // 2. Extract the actual Firestore Document ID (natural key)
      const studentSnap = querySnapshot.docs[0];
      const docId = studentSnap.id;
      setStudentDocId(docId); // Store the actual ID for the secure update

      const studentData = studentSnap.data() as Student;
      setStudent(studentData);

      // 3. Fetch the subcollection using the document snapshot reference
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
      setError('Error fetching data.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    // Ensure we have the retrieved Document ID (studentDocId) for the update
    if (!student || !selected || !studentDocId) return;
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Find the currently selected photo's metadata
      const chosenPhoto = photos.find((p) => p.url === selected);

      // 4. CRITICAL STEP: Use the secure Document ID (studentDocId) for the direct update
      const studentRef = doc(db, 'students', studentDocId);
      await updateDoc(studentRef, {
        chosenPhotoUrl: selected,
        chosenPhotoName: chosenPhoto?.originalName ?? null,
        hasChosen: true,
        choiceTimestamp: serverTimestamp(),
      });

      setSuccess('Photo confirmed!');

      // Update local state
      setStudent((prevStudent) =>
        prevStudent
          ? {
              ...prevStudent,
              chosenPhotoUrl: selected,
              chosenPhotoName: chosenPhoto?.originalName ?? null,
              hasChosen: true,
            }
          : null
      );
    } catch (err) {
      console.error(err);
      setError('Error updating selection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen min-h-screen flex flex-col items-center bg-gradient-to-b from-white to-zinc-50 p-6">
      <div
        className="flex flex-col md:flex-row w-full p-4"
        style={{
          maxWidth: '1200px',
          gap: '24px',
          borderRadius: '1rem',
          backgroundColor: 'white',
        }}
      >
        {/* Left Column */}
        <div className="flex-1 flex flex-col justify-center md:justify-start items-center md:items-start">
          <h1 className="font-extrabold text-center mx-auto md:mx-0 text-2xl md:text-3xl mb-6 text-green-800">
            <a href="https://www.yearbook-picker.vercel.app">
              Tino Ley Digital Photography<br></br>
              International School Manila SY2025-2026<br></br>
              Yearbook Photo Selection Tool
            </a>
          </h1>

          {/* Student Welcome */}
          {student && (
            <div className="text-gray-700 mb-6 w-full border-2 rounded-2xl p-6 border-green-800">
              <p className="text-lg font-medium mb-1">
                Welcome,{' '}
                <span className="font-bold text-green-800">
                  {student.firstName} {student.lastName}
                </span>
              </p>
              <p className="text-base font-semibold  text-red-600 mb-2">
                Don&apos;t forget to submit your chosen photo, order form, and
                payment by your department&apos;s deadline!
              </p>
              <ul className="list-disc list-inside text-sm font-medium ml-4">
                <li className="mb-0.5">ES: October 24</li>
                <li className="mb-0.5 line-through text-red-600">
                  MS: October 10
                </li>
                <li className="mb-0.5 line-through text-red-600">
                  HS Undergrad: October 10
                </li>
                <li className="mb-0.5">Seniors: October 18</li>
              </ul>
            </div>
          )}

          {/* Selected Photo / Enter Code */}
          <div className="bg-white rounded-2xl flex flex-col items-center w-full relative p-6 border-2 border-green-800 shadow">
            {!student ? (
              <div className="flex flex-col items-center gap-3 w-full">
                <input
                  type="text"
                  placeholder="Enter your code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="border-2 border-green-800 rounded-lg px-3 py-2 w-64 text-center focus:ring-2 focus:ring-green-600 focus:border-green-600 outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') fetchStudentData();
                  }}
                  autoComplete="off"
                  disabled={loading}
                />
                <button
                  onClick={fetchStudentData}
                  className="bg-green-800 text-white px-6 py-2 rounded-full font-semibold hover:bg-green-900 transition flex items-center justify-center disabled:opacity-50"
                  disabled={loading || !code}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    'Submit'
                  )}
                </button>
                {/* Simple inline messaging */}
                {error && (
                  <p className="text-red-500 mt-2 flex items-center">
                    <XCircle className="w-4 h-4 mr-1" /> {error}
                  </p>
                )}
                {success && (
                  <p className="text-green-600 mt-2 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" /> {success}
                  </p>
                )}
              </div>
            ) : (
              <div className="w-full aspect-[4/5] relative cursor-pointer ring-2 ring-green-800 rounded-lg">
                {selected ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={selected}
                      alt="Selected photo"
                      fill
                      style={{ objectFit: 'cover', borderRadius: '0.5rem' }}
                      priority
                    />
                    <div className="absolute top-1 right-1 rounded-full p-1 bg-white flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-800" />
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-center text-green-700">
                    No Photo Selected
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Gallery + Confirm */}
        {student && (
          <div className="flex-1 flex flex-col gap-6">
            {/* Photo Gallery */}
            <div className="bg-white rounded-2xl flex flex-col p-4 border-2 border-green-800 shadow">
              <h2 className="font-bold mb-3 text-green-800 text-lg">
                Photo Gallery
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 place-items-center">
                {photos.map((photo) => {
                  const isSelected = selected === photo.url;

                  return (
                    <div
                      key={photo.url}
                      className={`relative cursor-pointer w-full aspect-[4/5] rounded-lg ring-2 ring-green-800 ${
                        isSelected ? 'ring-offset-2' : 'hover:ring-green-800'
                      } transition-all`}
                      onClick={() => setSelected(photo.url)}
                    >
                      <Image
                        src={photo.url}
                        alt="photo"
                        fill
                        style={{ objectFit: 'cover', borderRadius: '0.5rem' }}
                      />
                      {isSelected && (
                        <div className="absolute top-1 right-1 rounded-full p-1 bg-white flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-green-800" />
                        </div>
                      )}
                      <p className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs text-center p-1 rounded-b-lg truncate">
                        {photo.originalName}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Confirm Button */}
            <div className="bg-white rounded-2xl flex flex-col items-center justify-center p-6 border-2 border-green-800 shadow">
              <p className="text-gray-700 font-semibold mb-3">
                Your photo package comes with one photo for editing and
                printing.
              </p>

              <button
                onClick={handleConfirm}
                className="bg-green-800 text-white px-6 py-2 rounded-full font-semibold transition-all duration-150 active:shadow-inner active:bg-green-900 flex items-center justify-center disabled:opacity-50"
                disabled={!selected || loading}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  'Set as Final Photo'
                )}
              </button>
            </div>
            {/* Simple inline messaging for confirmation step */}
            {error && (
              <p className="text-red-500 mt-2 flex items-center">
                <XCircle className="w-4 h-4 mr-1" /> {error}
              </p>
            )}
            {success && (
              <p className="text-green-600 mt-2 flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" /> {success}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
