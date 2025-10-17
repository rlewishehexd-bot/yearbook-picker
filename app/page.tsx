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
    <div className="w-screen h-screen flex flex-col items-center overflow-hidden bg-gradient-to-b from-white to-zinc-50 p-3">
      <div
        className="flex flex-col w-full"
        style={{
          maxWidth: '1200px',
          gap: '24px',
          borderRadius: '1rem',
          backgroundColor: 'white',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        {/* HEADER */}
        <div className="w-full text-center pb-2 shrink-0">
          <h1 className="font-extrabold text-2xl md:text-3xl text-green-800">
            Tino Ley Digital Photography
          </h1>
          <p className="text-lg md:text-xl font-bold text-gray-700">
            International School Manila SY2025-2026
          </p>
        </div>

        {/* MAIN CONTENT */}
        <div
          className="flex flex-col md:flex-row flex-1 overflow-hidden"
          style={{ gap: '24px' }}
        >
          {/* LEFT COLUMN */}
          <div className="flex-1 flex flex-col justify-start items-center md:items-start p-2 min-h-0">
            <h2 className="font-extrabold text-center mx-auto md:mx-0 text-2x1 md:text-2xl mb-4 text-green-800">
              Yearbook Photo Selection Tool
            </h2>

            {student && (
              <div className="text-gray-700 mb-4 w-full border-2 rounded-2xl p-4 border-green-800">
                <p className="text-lg font-medium mb-1">
                  Welcome,{' '}
                  <span className="font-bold text-green-800">
                    {student.firstName} {student.lastName}
                  </span>
                </p>
                <p className="text-base font-semibold text-red-600 mb-2">
                  Don&apos;t forget to submit your chosen photo, order form, and
                  payment by your department&apos;s deadline!
                </p>
                <ul className="list-disc list-inside text-sm font-medium ml-4">
                  <li>ES: October 24</li>
                  <li className="line-through text-red-600">MS: October 10</li>
                  <li className="line-through text-red-600">
                    HS Undergrad: October 10
                  </li>
                  <li>Seniors: October 18</li>
                </ul>
              </div>
            )}

            {/* CHOSEN PHOTO OR CODE INPUT */}
            <div
              className="bg-white rounded-2xl flex flex-col items-center w-full relative p-3 border-2 border-green-800 shadow"
              style={{
                flexShrink: 0,
                flexGrow: 0,
                flexBasis: 'auto',
                maxHeight: 'calc(100vh - 340px)',
              }}
            >
              {student && (
                <h3 className="font-bold mb-3 text-green-800 text-lg md:text-xl text-center">
                  Chosen Photo
                </h3>
              )}

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
                <div
                  className="w-full relative ring-2 ring-green-800 rounded-lg overflow-hidden"
                  style={{
                    aspectRatio: '4 / 5',
                    maxHeight: '60vh',
                    maxWidth: '100%',
                  }}
                >
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

          {/* RIGHT COLUMN */}
          {student && (
            <div className="flex-1 flex flex-col gap-6 overflow-hidden p-2">
              {/* GALLERY */}
              <div className="bg-white rounded-2xl flex flex-col p-3 border-2 border-green-800 shadow flex-grow overflow-hidden">
                <h3 className="font-bold mb-3 text-2x1 text-green-800 p-1">
                  Photo Gallery
                </h3>
                <div
                  className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 place-items-center overflow-y-auto"
                  style={{
                    maxHeight: '420px',
                    paddingRight: '4px',
                  }}
                >
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

              {/* CONFIRM BUTTON */}
              <div className="bg-white rounded-2xl flex flex-col items-center justify-center p-6 border-2 border-green-800 shadow shrink-0">
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
                    'Set as Chosen Photo'
                  )}
                </button>
              </div>

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

      {/* Responsive photo resizing */}
      <style jsx global>{`
        @media (max-width: 900px) {
          .chosen-photo {
            max-height: 45vh !important;
          }
        }
        @media (max-width: 600px) {
          .chosen-photo {
            max-height: 40vh !important;
          }
        }
      `}</style>
    </div>
  );
}
