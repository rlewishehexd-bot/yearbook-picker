'use client';

import { useState } from 'react';
import { db } from '../lib/firebaseClient';
import {
  doc,
  getDoc,
  collection,
  getDocs,
  updateDoc,
  serverTimestamp,
  Timestamp, // <-- Import Timestamp type
} from 'firebase/firestore';
import { CheckCircle } from 'lucide-react';
import Image from 'next/image'; // <-- Import Next.js Image component

type Photo = {
  url: string;
  timestamp: Timestamp; // <-- Corrected type from 'any' to 'Timestamp'
};

type Student = {
  firstName: string;
  lastName: string;
  chosenPhotoUrl?: string;
  hasChosen?: boolean;
  photos?: Photo[];
};

// Removed unused variable 'green'

export default function YearbookPickerPage() {
  const [code, setCode] = useState('');
  const [student, setStudent] = useState<Student | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // <-- We will now use this
  const [error, setError] = useState('');

  // Fetch student and photos when code is entered
  const fetchStudentData = async () => {
    setError('');
    setLoading(true);
    try {
      const studentRef = doc(db, 'students', code);
      const studentSnap = await getDoc(studentRef);
      if (!studentSnap.exists()) {
        setError('Invalid code');
        setStudent(null);
        setPhotos([]);
        setLoading(false);
        return;
      }

      const studentData = studentSnap.data() as Student;
      setStudent(studentData);

      const photosCol = collection(studentRef, 'photos');
      const photosSnap = await getDocs(photosCol);
      const photosList: Photo[] = photosSnap.docs
        .map((doc) => doc.data() as Photo)
        .sort((a, b) => a.timestamp?.seconds - b.timestamp?.seconds);
      setPhotos(photosList);

      // If student has already chosen a photo, pre-select it
      if (studentData.hasChosen && studentData.chosenPhotoUrl) {
        setSelected(studentData.chosenPhotoUrl);
      }
    } catch (err) {
      console.error(err);
      setError('Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  // Handle confirm selection
  const handleConfirm = async () => {
    if (!student || !selected) return;
    try {
      const studentRef = doc(db, 'students', code);
      await updateDoc(studentRef, {
        chosenPhotoUrl: selected,
        hasChosen: true,
        choiceTimestamp: serverTimestamp(),
      });
      alert('Photo confirmed!');
      setStudent({ ...student, chosenPhotoUrl: selected, hasChosen: true });
    } catch (err) {
      console.error(err);
      alert('Error updating selection');
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
            Yearbook Picture Tool
          </h1>

          {/* Selected Photo / Enter Code */}
          <div className="bg-white rounded-2xl flex flex-col items-center w-full relative p-6 border-2 border-green-800 shadow">
            {!student ? (
              <div className="flex flex-col items-center gap-3 w-full">
                <input
                  type="text"
                  placeholder="Enter your code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="border-2 border-green-800 rounded-lg px-3 py-2 w-64 text-center"
                />
                <button
                  onClick={fetchStudentData}
                  className="bg-green-800 text-white px-6 py-2 rounded-full font-semibold hover:bg-green-900 transition"
                  disabled={loading} // <-- Disable button while loading
                >
                  {loading ? 'Loading...' : 'Submit'}{' '}
                  {/* <-- Show loading state */}
                </button>
                {error && <p className="text-red-500">{error}</p>}
              </div>
            ) : (
              <div className="w-full aspect-[4/5] relative cursor-pointer ring-2 ring-green-800">
                {student.hasChosen && student.chosenPhotoUrl ? (
                  <div className="relative w-full h-full">
                    {/* Use Next.js Image component */}
                    <Image
                      src={student.chosenPhotoUrl}
                      alt="Previously chosen photo"
                      layout="fill"
                      objectFit="cover"
                      className="rounded-lg"
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
                  const isSelected = selected
                    ? selected === photo.url
                    : student.hasChosen && student.chosenPhotoUrl === photo.url;

                  return (
                    <div
                      key={photo.url}
                      className={`relative cursor-pointer w-full h-full aspect-[4/5] rounded-lg ring-2 ring-green-800 ${
                        isSelected ? 'ring-offset-2' : 'hover:ring-green-800'
                      } transition-all`}
                      onClick={() => setSelected(photo.url)}
                    >
                      {/* Use Next.js Image component */}
                      <Image
                        src={photo.url}
                        alt="photo"
                        layout="fill"
                        objectFit="cover"
                        className="rounded-lg"
                      />
                      {isSelected && (
                        <div className="absolute top-1 right-1 rounded-full p-1 bg-white flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-green-800" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Confirm Button */}
            <div className="bg-white rounded-2xl flex flex-col items-center justify-center p-4 border-2 border-green-800 shadow">
              <button
                onClick={handleConfirm}
                className="bg-green-800 text-white px-6 py-2 rounded-full font-semibold transition-all duration-150 active:shadow-inner active:bg-green-900"
                disabled={!selected} // <-- Disable if no photo is selected
              >
                Confirm
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
