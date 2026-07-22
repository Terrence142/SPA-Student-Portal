"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import useSWR, { mutate } from 'swr';
import { LogOut, Users, Settings, ShieldCheck, Megaphone, ArrowLeft, Moon, Sun, ReceiptText, UserCircle, Search, Filter, Download } from 'lucide-react';
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

export default function AdminDashboard() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeView, setActiveView] = useState('dashboard');
  
  // App State
  const [announcementMsg, setAnnouncementMsg] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [postStatus, setPostStatus] = useState('');
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Settings State
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [allowProfileEdits, setAllowProfileEdits] = useState(false);

  // SWR Hooks
  const { data: usersData, error: usersError, isLoading: isLoadingUsers } = useSWR(
    (currentUser && activeView === 'users') ? [GOOGLE_SCRIPT_URL, 'fetch_data', currentUser.role, currentUser.student_id] : null,
    ([url, action, role, id]) => fetcher(url, action, role, id),
    { revalidateOnFocus: false }
  );

  const { data: announcementsData } = useSWR(
    (currentUser && activeView === 'announcements') ? [GOOGLE_SCRIPT_URL, 'fetch_announcements', currentUser.role] : null,
    ([url, action, role]) => fetcher(url, action, role),
    { revalidateOnFocus: false }
  );
  const announcements = announcementsData || [];

  const { data: logsData } = useSWR(
    (currentUser && activeView === 'logs') ? [GOOGLE_SCRIPT_URL, 'fetch_admin_logs', currentUser.role] : null,
    ([url, action, role]) => fetcher(url, action, role),
    { revalidateOnFocus: false }
  );
  const logs = logsData || [];

  const { data: allTransactionsData, isLoading: isLoadingAllTransactions } = useSWR(
    (currentUser && activeView === 'transactions') ? [GOOGLE_SCRIPT_URL, 'fetch_transactions', currentUser.role] : null,
    ([url, action, role]) => fetcher(url, action, role),
    { revalidateOnFocus: false }
  );
  const allTransactions = allTransactionsData || [];


  const rawUsers = usersData ? usersData.filter((u: any) => u.student_id && u.role !== 'admin' && u.role !== 'staff') : [];
  
  const users = rawUsers.filter((u: any) => {
    const matchesSearch = u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.student_id?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = statusFilter === 'All' || u.status_val === statusFilter;
    return matchesSearch && matchesFilter;
  });

  const exportToCSV = () => {
    if (users.length === 0) {
      Swal.fire('Empty', 'No users to export in the current view.', 'info');
      return;
    }
    const headers = ['Student ID', 'Name', 'LRN', 'Balance', 'Status', 'Contact', 'Role'];
    const rows = users.map((u: any) => [
      u.student_id,
      `"${u.name || ''}"`,
      u.lrn || '',
      u.balance || 0,
      u.status_val || 'Pending',
      `"${u.contact || ''}"`,
      u.role || ''
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `student_balances_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
      router.push('/');
    } else {
      const user = JSON.parse(userStr);
      if (user.role !== 'admin') {
        router.push('/');
      } else {
        setCurrentUser(user);
      }
    }
  }, [router]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.view) {
        setActiveView(event.state.view);
      } else {
        setActiveView('dashboard');
      }
    };
    
    // Initialize initial state if not present
    window.history.replaceState({ view: 'dashboard' }, '', '');
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const changeView = (view: string) => {
    window.history.pushState({ view }, '', `#${view}`);
    setActiveView(view);
  };

  // Helper to flip "Lastname, Firstname Middle" to "Firstname Middle Lastname"
  const formatName = (rawName?: string) => {
    if (!rawName) return '';
    if (rawName.includes(',')) {
      const parts = rawName.split(',');
      if (parts.length >= 2) {
        return `${parts[1].trim()} ${parts[0].trim()}`;
      }
    }
    return rawName;
  };

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

  const viewProfile = (user: any) => {
    Swal.fire({
      title: 'Student Profile',
      html: `
        <div style="text-align: left; padding: 10px;">
          <p><strong>Name:</strong> ${formatName(user.name) || 'Not Set'}</p>
          <p><strong>Student ID:</strong> ${user.student_id}</p>
          <p><strong>LRN:</strong> ${user.lrn || 'Not Set'}</p>
          <p><strong>Date of Birth:</strong> ${user.dob ? new Date(user.dob).toLocaleDateString() : 'Not Set'}</p>
          <p><strong>Age:</strong> ${user.age || 'Not Set'}</p>
          <p><strong>Sex:</strong> ${user.sex || 'Not Set'}</p>
          <p><strong>Contact Number:</strong> ${user.contact || 'Not Set'}</p>
          <hr style="margin: 10px 0; border-color: #ddd;">
          <p><strong>Balance:</strong> ₱${user.balance || 0}</p>
          <p><strong>Status:</strong> ${user.status_val || 'Pending'}</p>
        </div>
      `,
      confirmButtonColor: '#1d4ed8'
    });
  };

  const viewLedger = (user: any) => {
    const studentTx = allTransactions.filter((tx: any) => tx.student_id === user.student_id);
    
    let htmlContent = '';
    if (studentTx.length === 0) {
      htmlContent = '<div class="p-4 text-center text-gray-500">No transactions found for this student.</div>';
    } else {
      htmlContent = `
        <div style="max-height: 300px; overflow-y: auto; text-align: left;" class="text-sm">
          ${studentTx.map((tx: any) => `
            <div class="border-b border-gray-200 dark:border-gray-700 py-3 flex justify-between">
              <div>
                <p class="font-semibold text-gray-800 dark:text-gray-200">${tx.description}</p>
                <p class="text-xs text-gray-500">${new Date(tx.date).toLocaleString()}</p>
              </div>
              <div class="text-right">
                <p class="font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}">
                  ${tx.amount > 0 ? '+' : ''}₱${tx.amount}
                </p>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    Swal.fire({
      title: `Ledger: ${formatName(user.name)}`,
      html: htmlContent,
      confirmButtonText: 'Close',
      confirmButtonColor: '#9333ea',
      width: '32em'
    });
  };

  const handleUpdateBalance = async (targetId: string, currentBalance: number, currentStatus: string) => {
    const { value: amount } = await Swal.fire({
      title: 'Log Transaction',
      input: 'number',
      inputLabel: 'Amount (₱)',
      inputPlaceholder: 'e.g. 500 (use negative for fees)',
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) return 'You need to write something!';
      }
    });

    if (!amount) return;

    const { value: description } = await Swal.fire({
      title: 'Transaction Description',
      input: 'text',
      inputLabel: 'Description',
      inputPlaceholder: 'e.g. Tuition Payment',
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) return 'Please provide a description!';
      }
    });

    if (!description) return;

    const newBalance = Number(currentBalance) - Number(amount);

    const tr = document.getElementById(`row-${targetId}`);
    const statusSelect = tr?.querySelector('.status-select') as HTMLSelectElement;
    const newStatus = statusSelect ? statusSelect.value : currentStatus;

    // AWS-style confirmation: type the student ID to confirm
    const { value: confirmedId } = await Swal.fire({
      title: 'Confirm Transaction',
      html: `
        <div class="aws-danger-banner">
          <span class="aws-warning-icon">🔴</span>
          <p>You are about to modify the financial record for student <span class="aws-resource-tag">${targetId}</span>.</p>
        </div>
        <div class="aws-checkbox-group">
          <div class="aws-checkbox-item">
            <input type="checkbox" id="aws-cb-1" />
            <label for="aws-cb-1">I understand this will change the balance from <strong>₱${currentBalance}</strong> to <strong>₱${newBalance}</strong></label>
          </div>
          <div class="aws-checkbox-item">
            <input type="checkbox" id="aws-cb-2" />
            <label for="aws-cb-2">I acknowledge this transaction (<strong>₱${amount}</strong> — ${description}) will be permanently logged</label>
          </div>
        </div>
        <div class="aws-confirm-input-group">
          <span class="aws-confirm-label">To confirm, type the student ID <code>${targetId}</code>:</span>
          <input id="aws-confirm-field" class="aws-confirm-input" placeholder="Type student ID" autocomplete="off" />
        </div>
      `,
      customClass: { popup: 'aws-confirm-popup' },
      showCancelButton: true,
      confirmButtonText: 'Execute Transaction',
      confirmButtonColor: '#dc2626',
      cancelButtonText: 'Cancel',
      focusConfirm: false,
      didOpen: () => {
        const input = document.getElementById('aws-confirm-field') as HTMLInputElement;
        const btn = Swal.getConfirmButton();
        const cb1 = document.getElementById('aws-cb-1') as HTMLInputElement;
        const cb2 = document.getElementById('aws-cb-2') as HTMLInputElement;
        if (btn) btn.disabled = true;
        const checkAll = () => {
          const match = input?.value?.trim() === targetId;
          const allChecked = cb1?.checked && cb2?.checked;
          input.className = 'aws-confirm-input' + (match ? ' matched' : (input.value.length > 0 ? ' error' : ''));
          if (btn) btn.disabled = !(match && allChecked);
        };
        input?.addEventListener('input', checkAll);
        cb1?.addEventListener('change', checkAll);
        cb2?.addEventListener('change', checkAll);
        input?.focus();
      },
      preConfirm: () => {
        const input = document.getElementById('aws-confirm-field') as HTMLInputElement;
        return input?.value?.trim();
      }
    });

    if (confirmedId !== targetId) return;

    try {
      Swal.fire({ title: 'Processing...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'add_transaction',
          role: currentUser.role,
          target_id: targetId,
          amount: amount,
          description: description,
          new_balance: newBalance,
          new_status: newStatus
        })
      });
      const result = await response.json();
      
      if (result.status === 'success') {
        mutate([GOOGLE_SCRIPT_URL, 'fetch_data', currentUser.role, currentUser.student_id]);
        Swal.fire('Success', 'Transaction logged & balance updated.', 'success');
        
        fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'transaction',
            studentId: targetId,
            amount: amount,
            description: description,
            newBalance: newBalance
          })
        }).catch(console.error);
        
      } else {
        Swal.fire('Error', result.message, 'error');
      }
    } catch (error) {
      Swal.fire('Error', 'Network error.', 'error');
    }
  };

  const handleDirectEdit = async (user: any) => {
    const { value: formValues } = await Swal.fire({
      title: `Edit Record`,
      html: `
        <div class="mb-4 text-left text-sm text-gray-500 dark:text-gray-400">
          Directly editing record for <strong>${user.student_id}</strong>
        </div>
        <div class="mb-4 text-left">
          <label class="block mb-1 text-sm font-medium">Exact Balance (₱)</label>
          <input id="swal-edit-balance" type="number" class="w-full bg-white dark:bg-[#1e293b] border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-black dark:text-white outline-none focus:border-blue-500" value="${user.balance || 0}" />
        </div>
        <div class="mb-2 text-left">
          <label class="block mb-1 text-sm font-medium">Status</label>
          <select id="swal-edit-status" class="w-full bg-white dark:bg-[#1e293b] border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-black dark:text-white outline-none focus:border-blue-500">
            <option value="Pending" ${user.status_val === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="Paid" ${user.status_val === 'Paid' ? 'selected' : ''}>Paid</option>
            <option value="Unpaid" ${user.status_val === 'Unpaid' ? 'selected' : ''}>Unpaid</option>
          </select>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Save Changes',
      preConfirm: () => {
        const bal = (document.getElementById('swal-edit-balance') as HTMLInputElement).value;
        const stat = (document.getElementById('swal-edit-status') as HTMLSelectElement).value;
        return { new_balance: bal, new_status: stat };
      }
    });

    if (formValues) {
      try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          body: JSON.stringify({
            action: 'edit_data',
            role: currentUser.role,
            author: currentUser.name || "Administrator",
            target_id: user.student_id,
            new_balance: formValues.new_balance,
            new_status: formValues.new_status
          })
        });
        const result = await response.json();
        if (result.status === 'success') {
          mutate([GOOGLE_SCRIPT_URL, 'fetch_data', currentUser.role, currentUser.student_id]);
          Swal.fire('Saved!', 'Student record updated directly.', 'success');
        } else {
          Swal.fire('Error', result.message, 'error');
        }
      } catch (error) {
        Swal.fire('Error', 'Network error.', 'error');
      }
    }
  };

  const handlePostAnnouncement = async () => {
    if (!announcementMsg.trim()) {
      Swal.fire('Warning', 'Please enter a message.', 'warning');
      return;
    }

    // AWS-style: consequence checkbox + type POST to confirm
    const { value: confirmed } = await Swal.fire({
      title: 'Broadcast Announcement',
      html: `
        <div class="aws-warning-banner">
          <span class="aws-warning-icon">📢</span>
          <p>This announcement will be <strong>immediately visible</strong> to all students and an <strong>email blast</strong> will be sent.</p>
        </div>
        <div class="aws-checkbox-group">
          <div class="aws-checkbox-item">
            <input type="checkbox" id="aws-cb-ann-1" />
            <label for="aws-cb-ann-1">I have reviewed the announcement content for accuracy</label>
          </div>
          <div class="aws-checkbox-item">
            <input type="checkbox" id="aws-cb-ann-2" />
            <label for="aws-cb-ann-2">I understand all students will receive an email notification</label>
          </div>
        </div>
        <div class="aws-confirm-input-group">
          <span class="aws-confirm-label">To confirm, type <code>post</code> below:</span>
          <input id="aws-confirm-field" class="aws-confirm-input" placeholder="Type post" autocomplete="off" />
        </div>
      `,
      customClass: { popup: 'aws-confirm-popup' },
      showCancelButton: true,
      confirmButtonText: 'Broadcast Now',
      confirmButtonColor: '#16a34a',
      cancelButtonText: 'Cancel',
      focusConfirm: false,
      didOpen: () => {
        const input = document.getElementById('aws-confirm-field') as HTMLInputElement;
        const btn = Swal.getConfirmButton();
        const cb1 = document.getElementById('aws-cb-ann-1') as HTMLInputElement;
        const cb2 = document.getElementById('aws-cb-ann-2') as HTMLInputElement;
        if (btn) btn.disabled = true;
        const checkAll = () => {
          const match = input?.value?.trim().toLowerCase() === 'post';
          const allChecked = cb1?.checked && cb2?.checked;
          input.className = 'aws-confirm-input' + (match ? ' matched' : (input.value.length > 0 ? ' error' : ''));
          if (btn) btn.disabled = !(match && allChecked);
        };
        input?.addEventListener('input', checkAll);
        cb1?.addEventListener('change', checkAll);
        cb2?.addEventListener('change', checkAll);
        input?.focus();
      },
      preConfirm: () => {
        const input = document.getElementById('aws-confirm-field') as HTMLInputElement;
        return input?.value?.trim().toLowerCase();
      }
    });

    if (confirmed !== 'post') return;

    setIsPosting(true);
    setPostStatus('');

    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'post_announcement',
          role: currentUser.role,
          author: currentUser.name || "Administrator",
          message: announcementMsg.trim()
        })
      });
      const result = await response.json();
      
      if (result.status === 'success') {
        setAnnouncementMsg('');
        setPostStatus('Announcement posted successfully!');
        
        fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'announcement',
            author: currentUser.name || "Administrator",
            message: announcementMsg.trim()
          })
        }).catch(console.error);
        
      } else {
        setPostStatus("Error: " + result.message);
      }
    } catch (error) {
      setPostStatus("Network error while posting.");
    } finally {
      setIsPosting(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex flex-col items-center justify-center font-sans transition-colors duration-300">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400 font-medium">Loading portal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex flex-col font-sans transition-colors duration-300 text-gray-900 dark:text-gray-100">
      
      {/* Navbar */}
      <nav className="bg-[#1d4ed8] dark:bg-gray-900 text-white shadow-lg sticky top-0 z-50 border-b border-transparent dark:border-gray-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <ShieldCheck className="h-8 w-8 mr-3 text-blue-200" />
              <span className="font-bold text-xl tracking-tight">Admin Console</span>
            </div>
            <div className="flex items-center space-x-4">
              <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 bg-blue-700 dark:bg-gray-800 rounded-lg hover:bg-blue-600 dark:hover:bg-gray-700 transition-colors">
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <span className="text-sm font-medium hidden sm:block">Welcome, {currentUser.name || 'Administrator'}</span>
              <button 
                onClick={handleLogout}
                className="bg-blue-700 dark:bg-gray-800 hover:bg-blue-600 dark:hover:bg-gray-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center shadow-inner"
              >
                <LogOut size={16} className="mr-2 hidden sm:block" /> Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* DASHBOARD GRID */}
        {activeView === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            <div onClick={() => changeView('users')} className="bg-white dark:bg-[#111] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 hover:shadow-md transition-shadow cursor-pointer group">
              <div className="bg-blue-50 dark:bg-blue-900/30 w-14 h-14 rounded-xl flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
                <Users size={28} />
              </div>
              <h2 className="text-xl font-bold mb-2">User Management</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">View students, log transactions, and edit status.</p>
              <button className="text-blue-600 dark:text-blue-400 font-semibold text-sm group-hover:text-blue-800 transition-colors">Manage Users &rarr;</button>
            </div>

            <div onClick={() => changeView('announcements')} className="bg-white dark:bg-[#111] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 hover:shadow-md transition-shadow cursor-pointer group">
              <div className="bg-green-50 dark:bg-green-900/30 w-14 h-14 rounded-xl flex items-center justify-center mb-4 text-green-600 dark:text-green-400">
                <Megaphone size={28} />
              </div>
              <h2 className="text-xl font-bold mb-2">Global Announcements</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Post important announcements and updates.</p>
              <button className="text-green-600 dark:text-green-400 font-semibold text-sm group-hover:text-green-800 transition-colors">Post Announcement &rarr;</button>
            </div>

            <div onClick={() => changeView('settings')} className="bg-white dark:bg-[#111] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 hover:shadow-md transition-shadow cursor-pointer group">
              <div className="bg-gray-100 dark:bg-gray-800 w-14 h-14 rounded-xl flex items-center justify-center mb-4 text-gray-600 dark:text-gray-300">
                <Settings size={28} />
              </div>
              <h2 className="text-xl font-bold mb-2">System Settings</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Configure global portal settings and maintenance.</p>
              <button className="text-gray-600 dark:text-gray-400 font-semibold text-sm group-hover:text-gray-200 transition-colors">View Settings &rarr;</button>
            </div>
            
            <div onClick={() => changeView('transactions')} className="bg-white dark:bg-[#111] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 hover:shadow-md transition-shadow cursor-pointer group">
              <div className="bg-purple-50 dark:bg-purple-900/30 w-14 h-14 rounded-xl flex items-center justify-center mb-4 text-purple-600 dark:text-purple-400">
                <ReceiptText size={28} />
              </div>
              <h2 className="text-xl font-bold mb-2">Transaction Ledger</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">View all financial transactions and payments.</p>
              <button className="text-purple-600 dark:text-purple-400 font-semibold text-sm group-hover:text-purple-800 transition-colors">View Ledger &rarr;</button>
            </div>
          </div>
        )}

        {/* USERS VIEW */}
        {activeView === 'users' && (
          <div className="bg-white dark:bg-[#111] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 sm:p-8 animate-fade-in">
            <button 
              onClick={() => changeView('dashboard')}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white font-medium mb-6 flex items-center transition-colors text-sm"
            >
              <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
            </button>
            
            <h2 className="text-2xl font-bold mb-2 flex items-center">
              <Users className="mr-3 text-blue-600 dark:text-blue-400" size={28} /> Manage Users & Transactions
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Log payments or fees. This will update the balance and record the transaction.</p>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0 md:space-x-4 bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by name or ID..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#111] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Filter className="h-5 w-5 text-gray-500" />
                  <select
                    className="border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#111] px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Unpaid">Unpaid</option>
                  </select>
                </div>
                
                <button
                  onClick={exportToCSV}
                  className="bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors shadow-sm"
                >
                  <Download size={18} className="mr-2" /> Export CSV
                </button>
              </div>
            </div>

            {isLoadingUsers ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="w-full h-12 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
                {/* Desktop Table */}
                <table className="w-full text-left border-collapse min-w-[900px] hidden md:table">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300">
                      <th className="p-3 font-semibold border-b dark:border-gray-800">Student ID</th>
                      <th className="p-3 font-semibold border-b dark:border-gray-800">Name</th>
                      <th className="p-3 font-semibold border-b dark:border-gray-800">Balance (₱)</th>
                      <th className="p-3 font-semibold border-b dark:border-gray-800">Status</th>
                      <th className="p-3 font-semibold border-b dark:border-gray-800 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user: any) => (
                      <tr key={user.student_id} id={`row-${user.student_id}`} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="p-3 font-medium">{user.student_id}</td>
                        <td className="p-3 text-gray-600 dark:text-gray-400 font-medium">{formatName(user.name) || <i className="opacity-50">Not set</i>}</td>
                        <td className="p-3 font-bold text-gray-800 dark:text-gray-200">
                          ₱{user.balance || 0}
                        </td>
                        <td className="p-3">
                          <select 
                            className="status-select bg-transparent border border-gray-300 dark:border-gray-700 rounded px-2 py-1.5 w-28 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:text-white"
                            defaultValue={user.status_val || 'Pending'}
                          >
                            <option className="text-black" value="Pending">Pending</option>
                            <option className="text-black" value="Paid">Paid</option>
                            <option className="text-black" value="Unpaid">Unpaid</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <div className="flex space-x-2 justify-center">
                            <button 
                              className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium py-1.5 px-2 rounded flex items-center transition-colors text-sm"
                              onClick={() => viewProfile(user)}
                              title="View Profile"
                            >
                              <UserCircle size={16} />
                            </button>
                            <button 
                              className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-1.5 px-2 rounded flex items-center transition-colors text-sm"
                              onClick={() => viewLedger(user)}
                              title="View Ledger"
                            >
                              <ReceiptText size={16} />
                            </button>
                            <button 
                              className="bg-green-600 hover:bg-green-700 text-white font-medium py-1.5 px-2 rounded flex items-center transition-colors text-sm"
                              onClick={() => handleDirectEdit(user)}
                              title="Direct Edit"
                            >
                              <Settings size={16} />
                            </button>
                            <button 
                              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 px-2 rounded flex items-center transition-colors text-sm"
                              onClick={() => handleUpdateBalance(user.student_id, user.balance, user.status_val)}
                              title="Log Transaction"
                            >
                              <ReceiptText size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-gray-500 dark:text-gray-400">
                          No users found. Make sure students have valid Student IDs.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Mobile Cards */}
                <div className="md:hidden flex flex-col space-y-4 p-2 bg-gray-50/50 dark:bg-transparent">
                  {users.map((user: any) => (
                    <div key={user.student_id} id={`mobile-row-${user.student_id}`} className="bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 p-4 rounded-xl shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-bold text-gray-800 dark:text-gray-200 text-lg">{formatName(user.name) || <i className="opacity-50">Not set</i>}</p>
                          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">{user.student_id}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Balance</p>
                          <p className="font-bold text-gray-800 dark:text-gray-200 text-lg">₱{user.balance || 0}</p>
                        </div>
                      </div>
                      
                      <div className="mb-4 bg-gray-50 dark:bg-[#0a0a0a] rounded-lg p-3 border border-gray-100 dark:border-gray-800">
                        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1.5 font-medium">Payment Status</label>
                        <select 
                          className="status-select bg-white dark:bg-[#111] border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 w-full outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:text-white text-sm shadow-sm"
                          defaultValue={user.status_val || 'Pending'}
                        >
                          <option className="text-black" value="Pending">Pending</option>
                          <option className="text-black" value="Paid">Paid</option>
                          <option className="text-black" value="Unpaid">Unpaid</option>
                        </select>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-2">
                        <button 
                          className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium py-2.5 px-2 rounded-lg flex flex-col items-center justify-center transition-colors text-xs border border-gray-200 dark:border-gray-600 shadow-sm"
                          onClick={() => viewProfile(user)}
                        >
                          <UserCircle size={20} className="mb-1 text-gray-500 dark:text-gray-300" /> Profile
                        </button>
                        <button 
                          className="bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-400 font-medium py-2.5 px-2 rounded-lg flex flex-col items-center justify-center transition-colors text-xs border border-purple-200 dark:border-purple-800 shadow-sm"
                          onClick={() => viewLedger(user)}
                        >
                          <ReceiptText size={20} className="mb-1" /> Ledger
                        </button>
                        <button 
                          className="bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40 text-green-700 dark:text-green-400 font-medium py-2.5 px-2 rounded-lg flex flex-col items-center justify-center transition-colors text-xs border border-green-200 dark:border-green-800 shadow-sm"
                          onClick={() => handleDirectEdit(user)}
                        >
                          <Settings size={20} className="mb-1" /> Edit Bal
                        </button>
                        <button 
                          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-2 rounded-lg flex flex-col items-center justify-center transition-colors text-xs shadow-sm"
                          onClick={() => handleUpdateBalance(user.student_id, user.balance, user.status_val)}
                        >
                          <ReceiptText size={20} className="mb-1" /> Log Tx
                        </button>
                      </div>
                    </div>
                  ))}
                  {users.length === 0 && (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800/40 rounded-xl border border-gray-200 dark:border-gray-700">
                      No users found. Make sure students have valid Student IDs.
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        )}

        {/* ANNOUNCEMENTS VIEW */}
        {activeView === 'announcements' && (
          <div className="bg-white dark:bg-[#111] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 sm:p-8 animate-fade-in max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <button 
                onClick={() => changeView('dashboard')}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white font-medium mb-6 flex items-center transition-colors text-sm"
              >
                <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
              </button>
              
              <h2 className="text-2xl font-bold mb-2 flex items-center">
                <Megaphone className="mr-3 text-green-600 dark:text-green-400" size={28} /> Post Announcement
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Write an announcement below. It will instantly appear on the Student Portal feed and email students.</p>
              
              <div className="space-y-4">
                <textarea 
                  value={announcementMsg}
                  onChange={(e) => setAnnouncementMsg(e.target.value)}
                  placeholder="Type your message here..."
                  className="w-full h-40 p-4 border border-gray-300 dark:border-gray-700 bg-transparent rounded-lg outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 resize-y"
                ></textarea>
                
                <button 
                  onClick={handlePostAnnouncement}
                  disabled={isPosting}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center disabled:opacity-70 w-full sm:w-auto justify-center"
                >
                  {isPosting ? 'Posting...' : 'Post & Email Students'}
                </button>
                
                {postStatus && (
                  <p className={`mt-2 font-medium ${postStatus.includes('Error') ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    {postStatus}
                  </p>
                )}
              </div>
            </div>

            {/* Past Announcements Feed */}
            <div className="bg-gray-50 dark:bg-gray-800/40 rounded-xl p-6 border border-gray-100 dark:border-gray-800 h-full overflow-y-auto max-h-[600px]">
              <h3 className="text-lg font-bold mb-4 flex items-center">Recent Announcements</h3>
              {announcements.length === 0 ? (
                <p className="text-gray-500 text-sm">No announcements posted yet.</p>
              ) : (
                <div className="space-y-4">
                  {announcements.slice().reverse().map((ann: any, idx: number) => (
                    <div key={idx} className="bg-white dark:bg-[#1a1a1a] p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">{ann.author}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{new Date(ann.date).toLocaleString()}</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{ann.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* AUDIT LOGS VIEW */}
        {activeView === 'logs' && (
          <div className="bg-white dark:bg-[#111] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 sm:p-8 animate-fade-in">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <ReceiptText className="mr-3 text-blue-600 dark:text-blue-400" size={28} /> Admin Activity Logs
            </h2>
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
              {/* Desktop Table */}
              <table className="w-full text-left border-collapse min-w-[700px] hidden md:table">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300">
                    <th className="p-3 font-semibold border-b dark:border-gray-800 w-[180px]">Time</th>
                    <th className="p-3 font-semibold border-b dark:border-gray-800 w-[150px]">Admin</th>
                    <th className="p-3 font-semibold border-b dark:border-gray-800 w-[180px]">Action</th>
                    <th className="p-3 font-semibold border-b dark:border-gray-800">Results</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log: any, idx: number) => (
                    <tr key={idx} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors text-sm">
                      <td className="p-3 text-gray-500 dark:text-gray-400">{log.timestamp}</td>
                      <td className="p-3 font-medium">{log.author}</td>
                      <td className="p-3 font-medium text-blue-600 dark:text-blue-400">{log.action}</td>
                      <td className="p-3 text-gray-600 dark:text-gray-300">{log.results}</td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-gray-500 dark:text-gray-400">
                        No administrative logs found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Mobile Cards */}
              <div className="md:hidden flex flex-col space-y-4 p-2 bg-gray-50/50 dark:bg-transparent">
                {logs.map((log: any, idx: number) => (
                  <div key={idx} className="bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 p-4 rounded-xl shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">{log.timestamp}</span>
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{log.author}</span>
                    </div>
                    <div className="mt-3 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg p-3">
                      <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-1">{log.action}</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{log.results}</p>
                    </div>
                  </div>
                ))}
                {logs.length === 0 && (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800/40 rounded-xl border border-gray-200 dark:border-gray-700">
                    No administrative logs found.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TRANSACTIONS VIEW */}
        {activeView === 'transactions' && (
          <div className="bg-white dark:bg-[#111] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 sm:p-8 animate-fade-in max-w-4xl mx-auto">
            <button 
              onClick={() => changeView('dashboard')}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white font-medium mb-6 flex items-center transition-colors text-sm"
            >
              <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
            </button>
            
            <h2 className="text-2xl font-bold mb-2 flex items-center">
              <ReceiptText className="mr-3 text-purple-600 dark:text-purple-400" size={28} /> Transaction Ledger
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">A complete record of all financial transactions logged in the system.</p>

            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
              {isLoadingAllTransactions ? (
                <div className="p-10 flex justify-center text-gray-500">
                  <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <>
                  <table className="w-full text-left border-collapse min-w-[700px] hidden md:table">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300">
                        <th className="p-3 font-semibold border-b dark:border-gray-800">Date/Time</th>
                        <th className="p-3 font-semibold border-b dark:border-gray-800">Student ID</th>
                        <th className="p-3 font-semibold border-b dark:border-gray-800">Amount (₱)</th>
                        <th className="p-3 font-semibold border-b dark:border-gray-800">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allTransactions.map((tx: any, idx: number) => (
                        <tr key={idx} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors text-sm">
                          <td className="p-3 text-gray-500 dark:text-gray-400">{new Date(tx.date).toLocaleString()}</td>
                          <td className="p-3 font-medium">{tx.student_id || 'Unknown'}</td>
                          <td className={`p-3 font-bold ${tx.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {tx.amount > 0 ? '+' : ''}₱{tx.amount}
                          </td>
                          <td className="p-3 text-gray-700 dark:text-gray-300">{tx.description}</td>
                        </tr>
                      ))}
                      {allTransactions.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-gray-500 dark:text-gray-400">
                            No transactions logged yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  
                  {/* Mobile View for Transactions */}
                  <div className="md:hidden flex flex-col space-y-4 p-2 bg-gray-50/50 dark:bg-transparent">
                    {allTransactions.map((tx: any, idx: number) => (
                      <div key={idx} className="bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 p-4 rounded-xl shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(tx.date).toLocaleString()}</span>
                          <span className={`text-sm font-bold ${tx.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {tx.amount > 0 ? '+' : ''}₱{tx.amount}
                          </span>
                        </div>
                        <p className="font-semibold text-gray-800 dark:text-gray-200">{tx.student_id}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{tx.description}</p>
                      </div>
                    ))}
                    {allTransactions.length === 0 && (
                      <div className="p-8 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800/40 rounded-xl border border-gray-200 dark:border-gray-700">
                        No transactions found.
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* SETTINGS VIEW */}
        {activeView === 'settings' && (
          <div className="bg-white dark:bg-[#111] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 sm:p-8 animate-fade-in max-w-3xl">
            <button 
              onClick={() => changeView('dashboard')}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white font-medium mb-6 flex items-center transition-colors text-sm"
            >
              <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
            </button>
            
            <h2 className="text-2xl font-bold mb-2 flex items-center">
              <Settings className="mr-3 text-gray-600 dark:text-gray-300" size={28} /> System Settings
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">Manage global configurations for the Student Portal.</p>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
                <div>
                  <h3 className="font-semibold text-lg">Maintenance Mode</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Lock the portal temporarily. Students will not be able to log in.</p>
                </div>
                <button 
                  onClick={async () => {
                    if (!maintenanceMode) {
                      // Turning ON maintenance mode is dangerous
                      const { value: typed } = await Swal.fire({
                        title: 'Enable Maintenance Mode',
                        html: `
                          <div class="aws-danger-banner">
                            <span class="aws-warning-icon">🔴</span>
                            <p><strong>Critical Action:</strong> Enabling maintenance mode will <strong>immediately lock out all students</strong> from the portal.</p>
                          </div>
                          <div class="aws-checkbox-group">
                            <div class="aws-checkbox-item">
                              <input type="checkbox" id="aws-cb-m1" />
                              <label for="aws-cb-m1">I understand all student logins will be blocked</label>
                            </div>
                            <div class="aws-checkbox-item">
                              <input type="checkbox" id="aws-cb-m2" />
                              <label for="aws-cb-m2">I have notified staff about this scheduled downtime</label>
                            </div>
                          </div>
                          <div class="aws-confirm-input-group">
                            <span class="aws-confirm-label">To confirm, type <code>MAINTENANCE</code>:</span>
                            <input id="aws-confirm-field" class="aws-confirm-input" placeholder="Type MAINTENANCE" autocomplete="off" />
                          </div>
                        `,
                        customClass: { popup: 'aws-confirm-popup' },
                        showCancelButton: true,
                        confirmButtonText: 'Enable Maintenance',
                        confirmButtonColor: '#dc2626',
                        cancelButtonText: 'Cancel',
                        focusConfirm: false,
                        didOpen: () => {
                          const input = document.getElementById('aws-confirm-field') as HTMLInputElement;
                          const btn = Swal.getConfirmButton();
                          const cb1 = document.getElementById('aws-cb-m1') as HTMLInputElement;
                          const cb2 = document.getElementById('aws-cb-m2') as HTMLInputElement;
                          if (btn) btn.disabled = true;
                          const checkAll = () => {
                            const match = input?.value?.trim() === 'MAINTENANCE';
                            const allChecked = cb1?.checked && cb2?.checked;
                            input.className = 'aws-confirm-input' + (match ? ' matched' : (input.value.length > 0 ? ' error' : ''));
                            if (btn) btn.disabled = !(match && allChecked);
                          };
                          input?.addEventListener('input', checkAll);
                          cb1?.addEventListener('change', checkAll);
                          cb2?.addEventListener('change', checkAll);
                          input?.focus();
                        },
                        preConfirm: () => {
                          const input = document.getElementById('aws-confirm-field') as HTMLInputElement;
                          return input?.value?.trim();
                        }
                      });
                      if (typed === 'MAINTENANCE') {
                        setMaintenanceMode(true);
                        Swal.fire('Maintenance Mode Enabled', 'The portal is now locked. Students cannot log in.', 'warning');
                      }
                    } else {
                      setMaintenanceMode(false);
                      Swal.fire('Maintenance Mode Disabled', 'The portal is now accessible to all students.', 'success');
                    }
                  }}
                  className={`w-12 h-6 rounded-full flex items-center transition-colors p-1 ${maintenanceMode ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-700'}`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${maintenanceMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
                <div>
                  <h3 className="font-semibold text-lg">Email Notifications</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Automatically send emails when new announcements or transactions are logged.</p>
                </div>
                <button 
                  onClick={() => setEmailNotifications(!emailNotifications)}
                  className={`w-12 h-6 rounded-full flex items-center transition-colors p-1 ${emailNotifications ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-700'}`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${emailNotifications ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
                <div>
                  <h3 className="font-semibold text-lg">Allow Profile Edits</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Permit students to update their own contact information from their dashboard.</p>
                </div>
                <button 
                  onClick={() => setAllowProfileEdits(!allowProfileEdits)}
                  className={`w-12 h-6 rounded-full flex items-center transition-colors p-1 ${allowProfileEdits ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'}`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${allowProfileEdits ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800 flex justify-end">
                <button 
                  onClick={() => Swal.fire('Saved!', 'System settings have been updated successfully.', 'success')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
