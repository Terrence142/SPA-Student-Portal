"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { User, Lock, CheckCircle, Loader2, Info, X, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Swal from 'sweetalert2';

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz6cR-xROnKZME0Fu3CSxiyhYlt4gJgcxxx-Wu_DR9sT2d8H4mrPTtU4XM5GWXFjzfe/exec';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showAbout, setShowAbout] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Auto-verify has been removed as per user request to use manual login button

  const handleVerifyId = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isVerifying || !studentId.trim()) return;
    
    setIsVerifying(true);
    setErrorMsg('');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        signal: controller.signal,
        body: JSON.stringify({ action: 'verifyId', student_id: studentId })
      });
      clearTimeout(timeoutId);
      const data = await response.json();
      
      if (data.status === 'success') {
        setDisplayName(data.name || 'User');
        setStep(2);
      } else {
        setErrorMsg('Student ID not found.');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        setErrorMsg('Server took too long. Please try again.');
      } else {
        setErrorMsg('Network error verifying ID. Please check your connection.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isVerifying || !password.trim()) return;

    setIsVerifying(true);
    setErrorMsg('');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        signal: controller.signal,
        body: JSON.stringify({ action: 'login', student_id: studentId, password: password })
      });
      clearTimeout(timeoutId);
      const data = await response.json();
      
      if (data.status === 'success') {
        localStorage.setItem('currentUser', JSON.stringify({
          student_id: studentId,
          role: data.user.role,
          name: data.user.name,
          balance: data.user.balance,
          status_val: data.user.status_val,
          lrn: data.user.lrn,
          dob: data.user.dob,
          age: data.user.age,
          sex: data.user.sex,
          contact: data.user.contact
        }));

        await Swal.fire({
          title: 'Login Successful!',
          text: 'Welcome to your portal.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });

        if (data.user.role === 'admin') router.push('/admin');
        else if (data.user.role === 'staff') router.push('/staff');
        else router.push('/student');
      } else {
        setErrorMsg(data.message || 'Incorrect Password');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        setErrorMsg('Server took too long. Please try again.');
      } else {
        setErrorMsg('Network Error. Please check your connection.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-fixed relative"
      style={{ backgroundImage: "url('/bghome.jpg')" }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
      
      <div className="relative w-full max-w-md bg-white/90 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20">
        <div className="text-center mb-8">
          <Image 
            src="/logo.png" 
            alt="School Logo" 
            width={100} 
            height={100} 
            className="mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-green-700 tracking-tight">Student Portal</h1>
          <p className="text-gray-500 mt-2 text-sm">Secure access to your records</p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium mb-6 text-center shadow-sm animate-pulse">
            {errorMsg}
          </div>
        )}

        {step === 2 && displayName && (
          <div className="bg-green-600 text-white p-3 rounded-lg text-sm font-medium mb-6 flex items-center justify-center shadow-md animate-fade-in-up">
            <CheckCircle className="w-4 h-4 mr-2" />
            Welcome, {displayName}!
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleVerifyId} className="space-y-6">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-green-600 transition-colors">
                <User size={20} />
              </div>
              <input
                type="text"
                placeholder="Enter Student ID"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all outline-none text-gray-700 font-medium"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isVerifying}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-green-600/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isVerifying ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : null}
              {isVerifying ? 'Checking...' : 'Next'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-6 animate-fade-in-up">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-green-600 transition-colors">
                <Lock size={20} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all outline-none text-gray-700 font-medium"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-green-600 transition-colors"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            
            <button
              type="submit"
              disabled={isVerifying}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-green-600/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isVerifying ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : null}
              {isVerifying ? 'Verifying...' : 'Sign In'}
            </button>
            
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setStudentId('');
                  setPassword('');
                  setErrorMsg('');
                }}
                className="text-sm text-gray-500 hover:text-green-600 font-medium transition-colors"
              >
                Not you? Change ID
              </button>
            </div>
          </form>
        )}

        {/* About Section Overlay */}
        {showAbout && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-md rounded-2xl p-6 sm:p-8 shadow-2xl border border-white/20 animate-fade-in z-10 overflow-y-auto flex flex-col">
            <div className="flex-none mb-6 mt-4">
              <button 
                type="button"
                className="absolute top-4 left-4 text-gray-500 hover:text-green-600 transition-colors flex items-center text-sm font-medium bg-white/50 px-2 py-1 rounded-md"
                onClick={() => setShowAbout(false)}
              >
                <ArrowLeft size={16} className="mr-1" /> Back
              </button>
              <h2 className="text-2xl font-bold text-green-700 text-center mt-6">Saint Patrick's Academy</h2>
            </div>
            
            <div className="text-gray-700 text-sm space-y-4 mb-6 flex-1">
              <p><strong>Location:</strong> Dingalan, Aurora</p>
              <p><strong>Founded:</strong> 1968</p>
              
              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-bold text-green-700 mb-1">Vision</h3>
                <p className="leading-relaxed">To provide holistic formation for students inspired by the Blessed Trinity and in communion with the family, church, and community.</p>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-bold text-green-700 mb-1">Mission</h3>
                <p className="leading-relaxed">Following Jesus Christ through living the Carmelian spirit of prayer, compassion, and prophetic action to provide quality education for the church and society.</p>
              </div>
            </div>
            
            <div className="flex-none pb-2 mt-4">
              <button
                onClick={() => setShowAbout(false)}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors w-max mx-auto shadow-md block"
              >
                Close
              </button>
            </div>
          </div>
        )}

      </div>
      
      {!showAbout && (
        <div className="absolute bottom-6 left-0 right-0 text-center">
          <button 
            type="button"
            className="text-white/80 hover:text-white transition-colors text-sm font-medium flex items-center justify-center mx-auto bg-black/30 px-4 py-2 rounded-full"
            onClick={() => setShowAbout(true)}
          >
            <Info size={16} className="mr-2" /> About this Portal
          </button>
        </div>
      )}
    </div>
  );
}
