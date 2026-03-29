import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, UploadCloud, ImageIcon, Info, X } from 'lucide-react';
import api from '../api';
import { getCurrencySymbol } from '../utils';
import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

function NewExpense({ user }) {
  const companyCurrency = user?.company?.currency || 'INR';
  const [formData, setFormData] = useState({ 
    submittedAmount: '', 
    submittedCurrency: companyCurrency, 
    category: 'Travel', 
    description: '', 
    date: '',
    receiptImageUrl: ''
  });
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // OCR & Image States
  const [previewImage, setPreviewImage] = useState(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [autoFilledFields, setAutoFilledFields] = useState([]); // tracks which fields got filled by OCR
  const [showBanner, setShowBanner] = useState(false);

  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showManagerNotice, setShowManagerNotice] = useState(true);

  const isManager = user?.role === 'MANAGER';
  const hasApproverAbove = user?.managerId && user?.manager?.isManagerApprover;
  
  const navigate = useNavigate();
  const timeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    api.get('/currencies').then(res => setCurrencies(res.data)).catch(console.error);
  }, []);

  const fetchPreview = useCallback(async (amount, curr) => {
    if (!amount || isNaN(amount) || curr === companyCurrency) {
      setPreview(null);
      setPreviewLoading(false);
      return;
    }
    setPreviewLoading(true);
    try {
      const res = await api.get(`/convert?amount=${amount}&from=${curr}`);
      setPreview(res.data);
    } catch (err) {
      setPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  }, [companyCurrency]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (autoFilledFields.includes(name)) {
      setAutoFilledFields(prev => prev.filter(f => f !== name));
    }

    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'submittedAmount' || name === 'submittedCurrency') {
       const newAmount = name === 'submittedAmount' ? value : formData.submittedAmount;
       const newCurr = name === 'submittedCurrency' ? value : formData.submittedCurrency;
       
       if (timeoutRef.current) clearTimeout(timeoutRef.current);
       if (!newAmount || isNaN(newAmount)) {
         setPreview(null);
         return;
       }
       if (newCurr !== companyCurrency) {
         setPreviewLoading(true);
         timeoutRef.current = setTimeout(() => fetchPreview(newAmount, newCurr), 500);
       } else {
         setPreview(null);
         setPreviewLoading(false);
       }
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type === 'application/pdf') {
      setIsScanning(true);
      setOcrProgress(5); // Indicates PDF processing has started
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 2.0 }); // Hi-Res
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({ canvasContext: context, viewport }).promise;
        const base64Str = canvas.toDataURL('image/jpeg', 0.95);
        
        setPreviewImage(base64Str);
        setFormData(prev => ({ ...prev, receiptImageUrl: base64Str }));
        await runOCR(base64Str);
      } catch (err) {
        console.error(err);
        alert("Failed to process the PDF document. Please try an image.");
        setIsScanning(false);
      }
    } else {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Str = reader.result;
        setPreviewImage(base64Str);
        setFormData(prev => ({ ...prev, receiptImageUrl: base64Str }));
        await runOCR(base64Str);
      };
      reader.readAsDataURL(file);
    }
  };

  const runOCR = async (base64Str) => {
    setIsScanning(true);
    setOcrProgress(10);
    setShowBanner(false);
    let extractedText = '';

    try {
      // Primary parsing: Browser-side Tesseract
      const { data } = await Tesseract.recognize(base64Str, 'eng', {
        logger: m => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.round(m.progress * 100));
          }
        }
      });
      extractedText = data.text;
    } catch (err) {
      console.warn("Browser OCR failed, relying on backend...", err);
      try {
        const res = await api.post('/expenses/ocr', { imageBase64: base64Str });
        extractedText = res.data.text;
        setOcrProgress(100);
      } catch (fallbackErr) {
        setIsScanning(false);
        return; 
      }
    }

    parseAutoFill(extractedText);
    setIsScanning(false);
  };

  const parseAutoFill = (text) => {
    if (!text.trim()) return;

    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    setFormData(prevForm => {
      const newFormData = { ...prevForm };
      const newlyFilled = [];

      // 1. Currency & Amount
      if (newFormData.submittedCurrency === companyCurrency) {
        if (/£|GBP/i.test(text)) { newFormData.submittedCurrency = 'GBP'; newlyFilled.push('submittedCurrency'); }
        else if (/€|EUR/i.test(text)) { newFormData.submittedCurrency = 'EUR'; newlyFilled.push('submittedCurrency'); }
        else if (/\$|USD/i.test(text)) { newFormData.submittedCurrency = 'USD'; newlyFilled.push('submittedCurrency'); }
        else if (/₹|INR/i.test(text)) { newFormData.submittedCurrency = 'INR'; newlyFilled.push('submittedCurrency'); }
      }

      if (!newFormData.submittedAmount) {
        const numMatches = text.match(/[\d,]+\.\d{2}/g);
        if (numMatches) {
          let maxAmount = 0;
          numMatches.forEach(n => {
            const val = parseFloat(n.replace(/,/g, ''));
            if (val > maxAmount) maxAmount = val;
          });
          if (maxAmount > 0) {
            newFormData.submittedAmount = maxAmount.toFixed(2);
            newlyFilled.push('submittedAmount');
          }
        }
      }

      // 2. Date
      if (!newFormData.date) {
        const dateRegex = /\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|[A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}\s+[A-Za-z]+\s+\d{4})\b/;
        const dMatch = text.match(dateRegex);
        if (dMatch) {
           const parsedDate = new Date(dMatch[0]);
           if (!isNaN(parsedDate)) {
             newFormData.date = parsedDate.toISOString().split('T')[0];
             newlyFilled.push('date');
           }
        }
      }

      // 3. Merchant & Description
      const merchant = lines[0] || 'Unknown Merchant';
      if (!newFormData.description) {
        let descLine = lines.find(l => /order|item|bill|invoice|total/i.test(l)) || '';
        let autoDesc = `${merchant} - Receipt via OCR. ${descLine}`;
        if (autoDesc.length > 100) autoDesc = autoDesc.substring(0, 97) + '...';
        newFormData.description = autoDesc;
        newlyFilled.push('description');
      }

      // 4. Category Match
      if (newFormData.category === 'Travel' && newlyFilled.length > 0) {
        const lowerText = text.toLowerCase();
        if (/restaurant|café|cafe|food|meal|dining/.test(lowerText)) { newFormData.category = 'Food'; newlyFilled.push('category'); }
        else if (/hotel|accommodation|lodge|airbnb|motel/.test(lowerText)) { newFormData.category = 'Accommodation'; newlyFilled.push('category'); }
        else if (/amazon|purchase|equipment|hardware|macbook/.test(lowerText)) { newFormData.category = 'Equipment'; newlyFilled.push('category'); }
        else if (/flight|train|taxi|uber|travel|lyft/.test(lowerText)) { newFormData.category = 'Travel'; newlyFilled.push('category'); }
        else { newFormData.category = 'Other'; newlyFilled.push('category'); }
      }

      if (newlyFilled.length > 0) {
        setAutoFilledFields(prev => [...prev, ...newlyFilled]);
        setShowBanner(true);
        
        // Trigger preview fetch if amount was auto-filled
        if (newlyFilled.includes('submittedAmount') && newFormData.submittedCurrency !== companyCurrency) {
           fetchPreview(newFormData.submittedAmount, newFormData.submittedCurrency);
        }
      }
      return newFormData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/expenses', formData);
      navigate('/dashboard');
    } catch (err) {
      alert('Failed to submit expense');
      setLoading(false);
    }
  };

  // Dynamic input styling for highlighter
  const inputClass = (name) => {
    const baseClass = "input-field w-full";
    if (autoFilledFields.includes(name)) {
      return `${baseClass} border-amber-text/60 bg-amber-text/5 focus:border-amber-text transition-colors`;
    }
    return baseClass;
  };

  return (
    <div className="max-w-2xl mx-auto pt-2 animate-in fade-in duration-300">
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-ink-3 hover:text-ink-1 text-[13px] font-medium transition-colors mb-6">
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>
      
      <div className="font-disp text-[26px] font-light tracking-tight text-ink-1 leading-tight mb-2">New Claim</div>
      <div className="text-ink-3 text-[13px] mb-8">Submit a new expense reimbursement request.</div>

      {isManager && showManagerNotice && (
        <div className="bg-blue-50 border-l-4 border-blue-500 mb-6 p-4 rounded-r-md1 flex justify-between items-start animate-in fade-in">
          <div className="flex gap-3">
             <Info size={18} className="text-blue-500 mt-0.5 shrink-0" />
             <div className="text-[13px] text-blue-900 font-medium mt-0.5">
               {hasApproverAbove 
                 ? `Since you are a manager, your submission will be reviewed by ${user.manager.name} before final approval` 
                 : `Your submission will go directly to Admin for approval`}
             </div>
          </div>
          <button type="button" onClick={() => setShowManagerNotice(false)} className="text-blue-500/70 hover:text-blue-500 transition-colors ml-4 mt-0.5 shrink-0">
            <X size={16} />
          </button>
        </div>
      )}

      {showBanner && (
        <div className="bg-amber-bg border-l-4 border-amber-text mb-6 p-4 rounded-r-md1 flex gap-3 animate-in slide-in-from-top-2">
          <Info size={18} className="text-amber-text mt-0.5 shrink-0" />
          <div className="text-[12.5px] text-ink-1">
             <span className="font-semibold text-amber-text block mb-0.5">Automated Extraction Complete</span>
             Fields have been auto-filled from your receipt image. Please verify they are correct before submitting. Any highlighted field can be modified manually.
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card relative overflow-hidden flex flex-col w-full shadow-sm">
        <div className="absolute top-0 right-0 w-48 h-48 bg-green-bg rounded-bl-full -z-10 opacity-60"></div>
        
        {/* SCANNER ENCLAVE */}
        <div className="p-6 md:p-8 pb-0 w-full mb-6">
           <label className="block text-[11px] font-semibold tracking-wide uppercase text-ink-3 mb-2">Receipt Scanning</label>
           <div 
             onClick={() => fileInputRef.current?.click()}
             className={`border-2 border-dashed rounded-md1 p-5 transition-colors cursor-pointer flex flex-col items-center justify-center text-center group ${previewImage ? 'border-border1 bg-surface' : 'border-green-text/30 bg-green-bg/20 hover:bg-green-bg hover:border-green-mid'}`}
           >
             <input type="file" accept="image/jpeg, image/png, application/pdf" ref={fileInputRef} className="hidden" onChange={handleFileUpload} disabled={loading || isScanning} />
             
             {isScanning ? (
                <div className="flex flex-col items-center py-4 w-full max-w-xs">
                  <div className="flex items-center gap-3 mb-4"><Loader2 size={24} className="animate-spin text-green-mid" /> <span className="font-semibold text-ink-2 text-[14px]">Extracting text...</span></div>
                  <div className="w-full h-2 bg-surface2 rounded-full overflow-hidden">
                    <div className="h-full bg-green-text transition-all duration-300 rounded-full" style={{ width: `${ocrProgress}%` }}></div>
                   </div>
                   <div className="text-[11px] text-ink-3 mt-2">{ocrProgress}% analyzed</div>
                </div>
             ) : previewImage ? (
                <div className="flex flex-col items-center">
                   <div className="w-[80px] h-[80px] rounded-[8px] overflow-hidden bg-surface2 border border-border1 mb-3">
                     <img src={previewImage} alt="Receipt Preview" className="w-full h-full object-cover" />
                   </div>
                   <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink-2 group-hover:text-green-mid transition-colors">
                     <UploadCloud size={14} /> Replace receipt image
                   </div>
                </div>
             ) : (
                <div className="py-6 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-105 transition-transform"><ImageIcon size={20} className="text-green-mid" /></div>
                  <div className="font-medium text-ink-1 text-[13.5px]">Drop receipt image or click to upload</div>
                  <div className="text-[12px] text-ink-3 mt-1.5">Supports JPG, PNG, and PDF (first page). Automated OCR will extract amounts and details instantly.</div>
                </div>
             )}
           </div>
        </div>

        <div className="h-[1px] w-full bg-border1"></div>

        <div className="p-6 md:p-8 pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 mb-5">
            <div>
              <label className="block text-[11px] font-semibold tracking-wide uppercase text-ink-3 mb-2">Amount & Currency</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3 font-medium text-[14px] z-10">
                    {getCurrencySymbol(formData.submittedCurrency)}
                  </span>
                  <input 
                    type="number" step="0.01" name="submittedAmount" 
                    className={`${inputClass('submittedAmount')} pl-8 font-mono h-[41px]`} 
                    onChange={handleChange} required placeholder="0.00" disabled={loading} value={formData.submittedAmount}
                  />
                </div>
                <select 
                  name="submittedCurrency" 
                  className={`${inputClass('submittedCurrency')?.replace('w-full','')} w-[110px] shrink-0 h-[41px]`} 
                  onChange={handleChange} 
                  value={formData.submittedCurrency} 
                  disabled={loading}
                >
                  {currencies.map(c => (
                    <option key={c.code} value={c.code} title={c.name}>{c.code}</option>
                  ))}
                </select>
              </div>
              
              <div className="h-6 mt-1 flex items-center">
                {formData.submittedCurrency !== companyCurrency && formData.submittedAmount && (
                  <div className="text-[12px] text-ink-2 font-medium flex items-center gap-1.5">
                    {previewLoading ? (
                      <><Loader2 size={12} className="animate-spin text-amber-text/70" /> <span className="text-ink-3 italic">calculating live rate...</span></>
                    ) : preview ? (
                      <>≈ {getCurrencySymbol(preview.to)}{new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2}).format(preview.converted)} {preview.to}</>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold tracking-wide uppercase text-ink-3 mb-2">Category</label>
              <select name="category" className={`${inputClass('category')} h-[41px]`} onChange={handleChange} value={formData.category} disabled={loading}>
                <option value="Travel">Travel</option>
                <option value="Food">Food</option>
                <option value="Accommodation">Accommodation</option>
                <option value="Equipment">Equipment</option>
                <option value="Software / Cloud">Software / Cloud</option>
                <option value="Training & Conferences">Training & Conferences</option>
                <option value="Office">Office</option>
                <option value="Meals & Entertainment">Meals & Entertainment</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="mb-6">
             <label className="block text-[11px] font-semibold tracking-wide uppercase text-ink-3 mb-2">Date Incurred</label>
             <input type="date" name="date" className={`${inputClass('date')} h-[41px]`} onChange={handleChange} required disabled={loading} value={formData.date} />
          </div>

          <div className="mb-8">
            <label className="block text-[11px] font-semibold tracking-wide uppercase text-ink-3 mb-2">Description / Purpose</label>
            <textarea name="description" className={`${inputClass('description')} min-h-[100px] resize-y p-2.5`} onChange={handleChange} required placeholder="Specific details about the expense..." disabled={loading} value={formData.description}></textarea>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-border1">
            <button type="button" onClick={() => navigate('/dashboard')} className="btn-ghost" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="flex-1 btn-primary text-white bg-green-text hover:bg-green-mid" disabled={loading}>
              {loading ? 'Submitting...' : <><Save size={16} /> Submit Claim</>}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default NewExpense;
