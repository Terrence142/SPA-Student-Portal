"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import useSWR from 'swr';
import { LogOut, GraduationCap, IdCard, CalendarDays, Bell, FileText, Download, Moon, Sun, ArrowLeft, ReceiptText, Megaphone, Edit3 } from 'lucide-react';
import Swal from 'sweetalert2';

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz6cR-xROnKZME0Fu3CSxiyhYlt4gJgcxxx-Wu_DR9sT2d8H4mrPTtU4XM5GWXFjzfe/exec';

const fetcher = async (url: string, action: string, role: string, student_id?: string) => {
  const res = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({ action, role, student_id })
  });
  const result = await res.json();
  if (result.status !== 'success') throw new Error(result.message);
  return result.data;
};

export default function StudentDashboard() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  // SWR Hook for Announcements
  const { data: announcements, isLoading: loadingAnnouncements } = useSWR(
    (currentUser && activeTab === 'announcements') ? [GOOGLE_SCRIPT_URL, 'fetch_announcements', 'student'] : null,
    ([url, action, role]) => fetcher(url, action, role)
  );

  // SWR Hook for Transactions
  const { data: transactions, isLoading: loadingTransactions } = useSWR(
    (currentUser && activeTab === 'profile') ? [GOOGLE_SCRIPT_URL, 'fetch_transactions', 'student', currentUser.student_id] : null,
    ([url, action, role, id]) => fetcher(url, action, role, id)
  );

  // SWR Hook for Current User Profile
  const { data: profileData, mutate: refreshProfile } = useSWR(
    currentUser ? [GOOGLE_SCRIPT_URL, 'fetch_data', 'student', currentUser.student_id] : null,
    ([url, action, role, id]) => fetcher(url, action, role, id)
  );

  const studentProfile = profileData ? profileData.find((u: any) => u.student_id === currentUser.student_id) : currentUser;

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
      router.push('/');
    } else {
      const user = JSON.parse(userStr);
      if (user.role !== 'student') {
        router.push('/');
      } else {
        setCurrentUser(user);
      }
    }
  }, [router]);

  const handleLogout = async () => {
    const { value: typed } = await Swal.fire({
      title: 'Sign Out',
      html: `
        <div class="aws-warning-banner">
          <span class="aws-warning-icon">⚠️</span>
          <p>You are about to <strong>end your session</strong>. Any unsaved changes will be lost.</p>
        </div>
        <div class="aws-confirm-input-group">
          <span class="aws-confirm-label">To confirm, type <code>logout</code> below:</span>
          <input id="aws-confirm-field" class="aws-confirm-input" placeholder="Type logout" autocomplete="off" />
        </div>
      `,
      customClass: { popup: 'aws-confirm-popup' },
      showCancelButton: true,
      confirmButtonText: 'Sign Out',
      confirmButtonColor: '#dc2626',
      cancelButtonText: 'Cancel',
      focusConfirm: false,
      didOpen: () => {
        const input = document.getElementById('aws-confirm-field') as HTMLInputElement;
        const btn = Swal.getConfirmButton();
        if (btn) btn.disabled = true;
        input?.addEventListener('input', () => {
          const match = input.value.trim().toLowerCase() === 'logout';
          input.className = 'aws-confirm-input' + (match ? ' matched' : (input.value.length > 0 ? ' error' : ''));
          if (btn) btn.disabled = !match;
        });
        input?.focus();
      },
      preConfirm: () => {
        const input = document.getElementById('aws-confirm-field') as HTMLInputElement;
        return input?.value?.trim().toLowerCase();
      }
    });
    if (typed === 'logout') {
      localStorage.removeItem('currentUser');
      router.push('/');
    }
  };

  const handleEditContact = async () => {
    const { value: newContact } = await Swal.fire({
      title: 'Update Contact Info',
      input: 'text',
      inputLabel: 'Phone Number / Email',
      inputValue: studentProfile.contact || '',
      showCancelButton: true,
      confirmButtonText: 'Save',
      inputValidator: (value) => {
        if (!value) return 'You need to enter contact information!';
      }
    });

    if (newContact && newContact !== studentProfile.contact) {
      Swal.fire({ title: 'Updating...', allowOutsideClick: false });
      Swal.showLoading();
      try {
        const res = await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          body: JSON.stringify({ 
            action: 'update_contact', 
            student_id: studentProfile.student_id, 
            contact: newContact 
          })
        });
        const result = await res.json();
        if (result.status === 'success') {
          Swal.fire('Success', 'Contact info updated!', 'success');
          refreshProfile();
        } else {
          Swal.fire('Error', result.message, 'error');
        }
      } catch (error) {
        Swal.fire('Error', 'Network error. Try again later.', 'error');
      }
    }
  };

  const handleDownload = (filename: string) => {
    Swal.fire({
      title: 'Download Started!',
      text: `In a fully built system, ${filename} would download now.`,
      icon: 'info',
      confirmButtonColor: '#16a34a'
    });
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#111] flex flex-col items-center justify-center font-sans">
        <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-300 font-medium">Loading student portal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans relative overflow-x-hidden flex flex-col text-white transition-colors duration-300">
      
      {/* Dynamic Background depending on theme */}
      <div className="fixed inset-0 bg-[url('/bghome.jpg')] bg-cover bg-center bg-fixed -z-20"></div>
      <div className={`fixed inset-0 transition-colors duration-500 -z-10 ${theme === 'dark' ? 'bg-black/70 backdrop-blur-md' : 'bg-black/40 backdrop-blur-sm'}`}></div>
      
      <div className="p-4 sm:p-8 min-h-screen">
        <div className="max-w-5xl mx-auto bg-white/10 dark:bg-black/40 backdrop-blur-[15px] border border-white/20 rounded-2xl p-6 sm:p-10 shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center">
              <GraduationCap className="mr-3 text-green-400" size={32} />
              Student Portal
            </h1>
            <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
              <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors border border-white/10">
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button 
                onClick={handleLogout}
                className="bg-red-500/80 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
              >
                <LogOut size={18} className="sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'dashboard' && (
            <div className="animate-fade-in-up">
              <p className="text-gray-200 mb-8 text-lg">
                Welcome back, <span className="font-semibold text-white">{currentUser.name || 'Student'}</span>! Check your progress and latest updates here.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div 
                  onClick={() => setActiveTab('profile')}
                  className="bg-white/10 hover:bg-white/20 border border-white/20 p-6 rounded-xl shadow-md cursor-pointer hover:-translate-y-1 transition-all group text-center"
                >
                  <IdCard size={40} className="text-green-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold mb-2">Profile & Ledger</h3>
                  <p className="text-sm text-gray-300">View your balance and transaction history.</p>
                </div>
                
                <div 
                  onClick={() => setActiveTab('schedule')}
                  className="bg-white/10 hover:bg-white/20 border border-white/20 p-6 rounded-xl shadow-md cursor-pointer hover:-translate-y-1 transition-all group text-center"
                >
                  <CalendarDays size={40} className="text-green-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold mb-2">Class Schedule</h3>
                  <p className="text-sm text-gray-300">View your weekly class schedule.</p>
                </div>
                
                <div 
                  onClick={() => setActiveTab('announcements')}
                  className="bg-white/10 hover:bg-white/20 border border-white/20 p-6 rounded-xl shadow-md cursor-pointer hover:-translate-y-1 transition-all group text-center"
                >
                  <Bell size={40} className="text-green-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold mb-2">Announcements</h3>
                  <p className="text-sm text-gray-300">Read the latest news and updates.</p>
                </div>
                
                <div 
                  onClick={() => setActiveTab('documents')}
                  className="bg-white/10 hover:bg-white/20 border border-white/20 p-6 rounded-xl shadow-md cursor-pointer hover:-translate-y-1 transition-all group text-center"
                >
                  <FileText size={40} className="text-green-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold mb-2">Documents</h3>
                  <p className="text-sm text-gray-300">Download handbook and waivers.</p>
                </div>
              </div>
            </div>
          )}

          {/* PROFILE AND TRANSACTIONS */}
          {activeTab === 'profile' && (
            <div className="animate-fade-in-up">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className="text-gray-300 hover:text-white font-medium mb-6 flex items-center transition-colors text-sm"
              >
                <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
              </button>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Profile Card */}
                <div className="bg-white/10 border border-white/20 rounded-xl p-6 md:col-span-1">
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-4 border border-green-500/30">
                    <GraduationCap size={40} className="text-green-400" />
                  </div>
                  <h2 className="text-2xl font-bold mb-1 capitalize">{studentProfile.name || 'Not provided'}</h2>
                  <p className="text-green-300 font-medium mb-4">{studentProfile.student_id}</p>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <span className="text-gray-400">Role</span>
                      <span className="capitalize">{studentProfile.role}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/10 pb-2">
                      <span className="text-gray-400">Contact</span>
                      <div className="flex items-center space-x-2">
                        <span>{studentProfile.contact || 'N/A'}</span>
                        <button 
                          onClick={handleEditContact}
                          className="p-1 bg-white/10 hover:bg-white/20 rounded transition-colors text-gray-300 hover:text-white"
                          title="Edit Contact"
                        >
                          <Edit3 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <span className="text-gray-400">Status</span>
                      <span className={`font-medium px-2 py-0.5 rounded ${
                        studentProfile.status_val === 'Paid' ? 'bg-green-500/20 text-green-300' :
                        studentProfile.status_val === 'Unpaid' ? 'bg-red-500/20 text-red-300' :
                        'bg-yellow-500/20 text-yellow-300'
                      }`}>
                        {studentProfile.status_val || 'Pending'}
                      </span>
                    </div>
                    <div className="flex flex-col mt-4 pt-4 border-t border-white/20">
                      <span className="text-gray-400 mb-1 text-center">Outstanding Balance</span>
                      <span className="text-4xl font-bold text-center text-white">₱{studentProfile.balance || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Transaction Ledger */}
                <div className="bg-white/10 border border-white/20 rounded-xl p-6 md:col-span-2 flex flex-col">
                  <h3 className="text-xl font-bold mb-4 flex items-center">
                    <ReceiptText className="mr-2 text-green-400" size={24} /> Transaction Ledger
                  </h3>
                  
                  {loadingTransactions ? (
                    <div className="flex-1 flex flex-col justify-center items-center py-10 opacity-70">
                       <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                       <p>Loading transactions...</p>
                    </div>
                  ) : transactions && transactions.length > 0 ? (
                    <div className="flex-1 overflow-y-auto pr-2 space-y-3 max-h-[400px]">
                      {transactions.map((tx: any, idx: number) => (
                        <div key={idx} className="bg-white/5 border border-white/10 rounded-lg p-4 flex justify-between items-center hover:bg-white/10 transition-colors">
                          <div>
                            <p className="font-semibold">{tx.description}</p>
                            <p className="text-xs text-gray-400 mt-1">{new Date(tx.date).toLocaleDateString()} at {new Date(tx.date).toLocaleTimeString()}</p>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold text-lg ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {tx.amount > 0 ? '+' : ''}₱{tx.amount}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col justify-center items-center py-10 opacity-50 bg-white/5 rounded-lg border border-white/5 border-dashed">
                      <ReceiptText size={48} className="mb-3 opacity-50" />
                      <p>No transactions found.</p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* ANNOUNCEMENTS TAB */}
          {activeTab === 'announcements' && (
            <div className="animate-fade-in-up">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className="text-gray-300 hover:text-white font-medium mb-6 flex items-center transition-colors text-sm"
              >
                <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
              </button>
              
              <h2 className="text-2xl font-bold mb-6 flex items-center border-b border-white/20 pb-4">
                <Bell className="mr-3 text-green-400" size={28} /> Global Announcements
              </h2>
              
              <div className="space-y-6">
                {loadingAnnouncements ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-full h-32 bg-white/10 rounded-xl animate-pulse"></div>
                    ))}
                  </div>
                ) : announcements && announcements.length > 0 ? (
                  announcements.map((ann: any, idx: number) => (
                    <div key={idx} className="bg-white/10 border border-white/20 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3 border-b border-white/10 pb-3">
                        <span className="font-bold text-green-400 flex items-center">
                          <Megaphone size={16} className="mr-2"/> 
                          {ann.author}
                        </span>
                        <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded">
                          {new Date(ann.date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed text-gray-200">
                        {ann.message}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10 border-dashed">
                    <Bell className="mx-auto h-12 w-12 text-gray-500 mb-4 opacity-50" />
                    <p className="text-gray-400">No announcements yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DOCUMENTS TAB */}
          {activeTab === 'documents' && (
            <div className="animate-fade-in-up">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className="text-gray-300 hover:text-white font-medium mb-6 flex items-center transition-colors text-sm"
              >
                <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
              </button>
              
              <h2 className="text-2xl font-bold mb-6 flex items-center border-b border-white/20 pb-4">
                <FileText className="mr-3 text-green-400" size={28} /> Documents & Forms
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['Student Handbook 2025', 'Enrollment Waiver', 'Health Declaration Form', 'Campus Map'].map((doc, idx) => (
                  <div key={idx} className="bg-white/10 border border-white/20 p-5 rounded-xl flex justify-between items-center hover:bg-white/20 transition-colors">
                    <div className="flex items-center">
                      <FileText size={24} className="text-blue-300 mr-3" />
                      <span className="font-medium">{doc}.pdf</span>
                    </div>
                    <button 
                      onClick={() => handleDownload(doc)}
                      className="p-2 bg-green-500/20 hover:bg-green-500 text-green-300 hover:text-white rounded-lg transition-colors"
                    >
                      <Download size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SCHEDULE TAB */}
          {activeTab === 'schedule' && (
            <div className="animate-fade-in-up">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className="text-gray-300 hover:text-white font-medium mb-6 flex items-center transition-colors text-sm"
              >
                <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
              </button>
              
              <h2 className="text-2xl font-bold mb-6 flex items-center border-b border-white/20 pb-4">
                <CalendarDays className="mr-3 text-green-400" size={28} /> Weekly Schedule
              </h2>
              
              <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10 border-dashed">
                <CalendarDays className="mx-auto h-12 w-12 text-gray-500 mb-4 opacity-50" />
                <p className="text-gray-400 font-medium">Your class schedule is not available yet.</p>
                <p className="text-gray-500 text-sm mt-1">Please check back after enrollment is fully validated.</p>
              </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
