'use client';
import { useState } from 'react';
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
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
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
  uniquecode: string;
};

export default function YearbookPickerPage() {
  const [code, setCode] = useState('');
  const [student, setStudent] = useState<Student | null>(null);
  const [studentDocId, setStudentDocId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchStudentData = async () => {
    setError('');
    setSuccess('');
    setStudent(null);
    setPhotos([]);
    setStudentDocId(null);
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setError('Please enter a code.');
      return;
    }
    setLoading(true);
    try {
      const studentsRef = collection(db, 'students');
      const q = query(studentsRef, where('uniquecode', '==', trimmedCode));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        setError('Invalid code.');
        return;
      }
      const studentSnap = querySnapshot.docs[0];
      const docId = studentSnap.id;
      setStudentDocId(docId);
      const studentData = studentSnap.data() as Student;
      setStudent(studentData);

      const photosCol = collection(studentSnap.ref, 'photos');
      const photosSnap = await getDocs(photosCol);
      const photosList: Photo[] = photosSnap.docs
        .map((doc) => doc.data() as Photo)
        .sort((a, b) => a.timestamp.seconds - b.timestamp.seconds);
      setPhotos(photosList);

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
    if (!student || !selected || !studentDocId) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const chosenPhoto = photos.find((p) => p.url === selected);
      const studentRef = doc(db, 'students', studentDocId);
      await updateDoc(studentRef, {
        chosenPhotoUrl: selected,
        chosenPhotoName: chosenPhoto?.originalName ?? null,
        hasChosen: true,
        choiceTimestamp: serverTimestamp(),
      });
      setSuccess('Photo confirmed!');
      setStudent((prev) =>
        prev
          ? {
              ...prev,
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
    <div className="h-screen w-full overflow-hidden bg-gradient-to-b from-white to-zinc-50 text-gray-900 p-4 md:p-6 flex flex-col">
      {/* HEADER */}
      <header className="text-center mb-3 flex-shrink-0">
        <h1 className="font-extrabold text-2xl md:text-3xl text-green-800 leading-tight">
          Tino Ley Digital Photography
        </h1>
        <p className="text-sm md:text-base font-semibold text-gray-700">
          International School Manila SY2025-2026
        </p>
      </header>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 flex-grow max-h-[calc(100vh-110px)] overflow-hidden">
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-3 h-full">
          <h2 className="font-extrabold text-green-800 text-lg md:text-xl">
            Yearbook Photo Selection Tool
          </h2>

          {/* WELCOME SECTION */}
          {student && (
            <div className="border-2 border-green-800 rounded-2xl p-3 bg-white shadow-sm">
              <p className="text-base">
                Welcome,{' '}
                <span className="font-bold text-green-800">
                  {student.firstName} {student.lastName}
                </span>
              </p>
              <p className="text-sm font-semibold text-red-600 mt-1">
                Don’t forget to submit your chosen photo, order form, and
                payment by your department’s deadline!
              </p>
              <ul className="list-disc list-inside text-xs mt-1">
                <li>ES: October 24</li>
                <li className="line-through text-red-600">MS: October 10</li>
                <li className="line-through text-red-600">
                  HS Undergrad: October 10
                </li>
                <li>Seniors: October 18</li>
              </ul>
            </div>
          )}

          {/* PHOTO GALLERY */}
          {student && (
            <div className="border-2 border-green-800 rounded-2xl p-3 bg-white shadow-sm flex flex-col flex-1 overflow-y-auto">
              <h3 className="font-bold text-green-800 text-base mb-2">
                Photo Gallery
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {photos.map((photo) => {
                  const isSelected = selected === photo.url;
                  return (
                    <div
                      key={photo.url}
                      className={`relative cursor-pointer w-full aspect-[4/5] rounded-md ring-2 ring-green-800 ${
                        isSelected ? 'ring-offset-2' : 'hover:ring-green-800'
                      } transition-all`}
                      onClick={() => setSelected(photo.url)}
                    >
                      <Image
                        src={photo.url}
                        alt="photo"
                        fill
                        style={{ objectFit: 'cover', borderRadius: '0.25rem' }}
                      />
                      {isSelected && (
                        <div className="absolute top-1 right-1 bg-white rounded-full p-0.5">
                          <CheckCircle className="w-4 h-4 text-green-800" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-3 h-full">
          {/* CHOSEN PHOTO */}
          <div className="border-2 border-green-800 rounded-2xl p-3 bg-white shadow-sm flex flex-col items-center flex-1 justify-center">
            {student ? (
              <>
                <h3 className="font-bold text-green-800 text-base mb-2">
                  Chosen Photo
                </h3>
                {selected ? (
                  <div className="relative w-full max-w-xs aspect-[4/5] rounded-md overflow-hidden ring-2 ring-green-800">
                    <Image
                      src={selected}
                      alt="Chosen photo"
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                    <div className="absolute top-1 right-1 bg-white rounded-full p-1">
                      <CheckCircle className="w-5 h-5 text-green-800" />
                    </div>
                  </div>
                ) : (
                  <div className="w-full max-w-xs aspect-[4/5] flex items-center justify-center text-gray-600 border border-dashed border-green-800 rounded-md">
                    No Photo Selected
                  </div>
                )}
              </>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Enter your code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="border-2 border-green-800 rounded-lg px-3 py-2 w-60 text-center focus:ring-2 focus:ring-green-600 outline-none mb-2"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') fetchStudentData();
                  }}
                  autoComplete="off"
                  disabled={loading}
                />
                <button
                  onClick={fetchStudentData}
                  className="bg-green-800 text-white px-5 py-2 rounded-full font-semibold hover:bg-green-900 transition disabled:opacity-50"
                  disabled={loading || !code}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" />
                  ) : null}
                  Submit
                </button>
                {error && (
                  <p className="text-red-500 mt-1 flex items-center text-sm">
                    <XCircle className="w-4 h-4 mr-1" /> {error}
                  </p>
                )}
                {success && (
                  <p className="text-green-600 mt-1 flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 mr-1" /> {success}
                  </p>
                )}
              </>
            )}
          </div>

          {/* CONFIRM SECTION */}
          {student && (
            <div className="border-2 border-green-800 rounded-2xl p-3 bg-white shadow-sm flex flex-col items-center justify-center flex-shrink-0">
              <p className="text-gray-700 font-semibold mb-2 text-center text-sm">
                Your photo package comes with one photo for editing and
                printing.
              </p>
              <button
                onClick={handleConfirm}
                className="bg-green-800 text-white px-5 py-2 rounded-full font-semibold hover:bg-green-900 transition disabled:opacity-50 flex items-center"
                disabled={!selected || loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Set as Chosen Photo
              </button>
              {success && (
                <p className="text-green-600 mt-1 flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 mr-1" /> {success}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
