
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { 
  Key, FileText, Upload, Plus, CheckCircle, 
  AlertTriangle, Loader2, LogOut, Download, Send
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { documentApi, authApi } from '../services/api';
import { useNavigate } from 'react-router-dom';


const generateSchema = zod.object({
  name: zod.string().min(3, 'Full name must be at least 3 characters. Ensure it matches your portal records.'),
});

type GenerateFields = zod.infer<typeof generateSchema>;

export const Dashboard: React.FC = () => {
  const { profile, signOut, refreshProfile } = useAuth();
  const [activationKey, setActivationKey] = useState('');
  const [keyError, setKeyError] = useState<string | null>(null);
  const [keySuccess, setKeySuccess] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState(false);

  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [passportPreview, setPassportPreview] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationSuccess, setGenerationSuccess] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [myTests, setMyTests] = useState<any[]>([]);

  const [activeTest, setActiveTest] = useState<any | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [telegramUsername, setTelegramUsername] = useState('@merlin_admin');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GenerateFields>({
    resolver: zodResolver(generateSchema),
  });

  const loadMyTests = async () => {
    try {
      const data = await documentApi.getMyTests();
      setMyTests(data);
    } catch (err) {
      console.error('Failed to load certificates:', err);
    }
  };

  const loadSettings = async () => {
    try {
      const data = await authApi.getPublicSettings();
      if (data?.telegram_username) {
        setTelegramUsername(data.telegram_username);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  useEffect(() => {
    loadMyTests();
    loadSettings();
  }, []);
 
// Inside your Dashboard component:
const navigate = useNavigate();

useEffect(() => {
  if (profile?.role === 'admin') {
    navigate('/admin', { replace: true });
  }
}, [profile, navigate]);

  const handleKeyRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activationKey.trim()) return;

    setKeyError(null);
    setKeySuccess(null);
    setIsActivating(true);

    try {
      const response = await authApi.activateKey(activationKey.trim());
      setKeySuccess(response.message);
      setActivationKey('');
      await refreshProfile();
    } catch (err: any) {
      setKeyError(err.response?.data?.error || 'Invalid activation key. Verify key code.');
    } finally {
      setIsActivating(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setGenerationError('File size exceeds the 5MB limit.');
        return;
      }
      setPassportFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPassportPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onGenerate = async (data: GenerateFields) => {
    setGenerationError(null);
    
    if (!passportFile) {
      setGenerationError('Passport photograph is required.');
      return;
    }

    setIsGenerating(true);
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('passport', passportFile);

    try {
      const response = await documentApi.generate(formData);
      setGenerationSuccess(true);
      reset();
      setPassportFile(null);
      setPassportPreview(null);
      await refreshProfile();
      await loadMyTests();
      setActiveTest(response);
      setPreviewOpen(true);
    } catch (err: any) {
      setGenerationError(err.response?.data?.error || 'Failed to generate drug test. Contact admin.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async (testId: string) => {
    await documentApi.trackDownload(testId);

    const printWindow = window.open(
        documentApi.getRenderUrl(testId),
        "_blank",
        "width=900,height=1200"
    );

    if (!printWindow) return;

    printWindow.onload = () => {
        setTimeout(() => {
            printWindow.print();
        }, 1000);
    };
  };

  const telegramLink = `https://t.me/${telegramUsername.replace('@', '')}`;

  return (
    <div className="min-h-screen bg-cyber-bg text-cyber-text flex flex-col">
      <nav className="border-b border-cyber-border bg-cyber-surface/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between h-auto py-4 sm:py-0 sm:h-16 gap-4 sm:gap-2">
            <div className="flex items-center gap-2">
              <img src="https://res.cloudinary.com/uf6qp7jz/image/upload/f_auto,q_auto/ndlealogo_l2rdji" alt="NDLEA Logo" className="h-6 w-auto object-contain md:h-7" />
              <span className="font-bold text-base md:text-lg tracking-wider text-white">MERLIN PORTAL</span>
            </div>
            <div className="flex items-center flex-wrap justify-center gap-3 md:gap-4">
                            <span className="text-xs md:text-sm text-cyber-text-muted">{profile?.email}</span>
              <button 
                onClick={() => signOut()} 
                className="text-cyber-danger hover:text-white transition-colors flex items-center gap-1 text-xs md:text-sm font-semibold cursor-pointer border border-cyber-danger/20 hover:border-cyber-danger/50 px-2 py-1 rounded bg-cyber-danger/5"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
          
          {/* Left Column: Account Details & Code Activation */}
          <div className="space-y-6">
            
            {/* Generation Balance Panel */}
            <div className="cyber-panel p-4 sm:p-6 bg-cyber-surface-card/40">
              <h2 className="text-xs font-bold uppercase tracking-wider text-cyber-text-muted mb-4">Authorization State</h2>
              <div className="flex items-center justify-between border-b border-cyber-border pb-4 mb-4">
                <span className="text-sm font-medium">Generation Balance</span>
                <span className={`text-xl sm:text-2xl font-black ${profile?.generation_balance && profile.generation_balance > 0 ? 'text-cyber-primary' : 'text-cyber-danger'}`}>
                  {profile?.generation_balance ?? 0} TESTS
                </span>
              </div>

              {profile?.generation_balance === 0 && (
                <div className="p-3 sm:p-4 bg-cyber-warning/10 border border-cyber-warning/30 rounded text-cyber-warning text-xs space-y-2 mb-4 leading-relaxed">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      You have <strong>0</strong> drug integrity test generation rights. The "Generate" button is disabled until you redeem an activation key.
                    </span>
                  </div>
                  <a href={telegramLink} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-cyber-primary hover:underline font-bold">
                    <Send className="h-3 w-3" /> Contact Admin on Telegram
                  </a>
                </div>
              )}
            </div>

            {/* Code Activation Form */}
            <div className="cyber-panel p-4 sm:p-6 bg-cyber-surface-card/40">
              <h2 className="text-xs font-bold uppercase tracking-wider text-cyber-text-muted mb-4">Redeem Activation Key</h2>
              
              {keyError && (
                <div className="p-3 bg-cyber-danger/10 border border-cyber-danger/30 rounded text-cyber-danger text-xs mb-4">
                  {keyError}
                </div>
              )}

              {keySuccess && (
                <div className="p-3 bg-cyber-success/10 border border-cyber-success/30 rounded text-cyber-success text-xs mb-4">
                  {keySuccess}
                </div>
              )}

              <form onSubmit={handleKeyRedeem} className="space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder="DT-XXXX-XXXX-XXXX"
                    value={activationKey}
                    onChange={(e) => setActivationKey(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2.5 sm:py-2 bg-cyber-surface border border-cyber-border text-white placeholder-cyber-text-muted uppercase text-sm tracking-wider font-mono text-center"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isActivating || !activationKey.trim()}
                  className="w-full cyber-button text-sm py-2.5 flex items-center justify-center gap-2"
                >
                  {isActivating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Verifying Code...
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4" /> Activate Generation Right
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Center Column: Generate Certificate Form */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Generate Document Form */}
            <div className="cyber-panel p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-white mb-6 border-b border-cyber-border pb-2 flex items-center gap-2">
                <FileText className="h-5 w-5 text-cyber-primary" /> Generate Integrity Certificate
              </h2>

              {generationError && (
                <div className="p-3 sm:p-4 bg-cyber-danger/10 border border-cyber-danger/30 rounded text-cyber-danger text-sm mb-6">
                  {generationError}
                </div>
              )}

              {generationSuccess && (
                <div className="p-3 sm:p-4 bg-cyber-success/10 border border-cyber-success/30 rounded text-cyber-success text-sm mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <CheckCircle className="h-5 w-5 shrink-0" />
                  <span>Certificate successfully compiled! Click preview below to view and save.</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onGenerate)} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-cyber-text-muted mb-2">
                    Candidate Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    placeholder="SURNAME FIRSTNAME MIDDLENAME"
                    className="w-full px-4 py-3 bg-cyber-surface border border-cyber-border text-white text-sm"
                    {...register('name')}
                  />
                  <p className="mt-1.5 text-xs text-cyber-text-muted">
                    Must match the candidate's exact name format on the ATBU portal.
                  </p>
                  {errors.name && (
                    <p className="mt-2 text-xs text-cyber-danger">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-cyber-text-muted mb-2">
                    Passport Photograph (Max 5MB)
                  </label>
                  <div className="flex flex-col-reverse sm:grid sm:grid-cols-4 gap-6 items-center">
                    <div className="w-full sm:col-span-3">
                      <div className="border-2 border-dashed border-cyber-border rounded-lg p-6 hover:border-cyber-primary/60 transition-colors relative flex flex-col items-center justify-center cursor-pointer bg-cyber-surface/40">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Upload className="h-8 w-8 text-cyber-text-muted mb-3" />
                        <span className="text-sm font-semibold mb-1 text-center">
                          {passportFile ? passportFile.name : 'Choose file...'}
                        </span>
                        <span className="text-xs text-cyber-text-muted text-center">
                          Supports JPEG, JPG, PNG up to 5MB
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-center w-full sm:w-auto">
                      <div className="h-28 w-28 border border-cyber-border rounded overflow-hidden bg-cyber-surface flex items-center justify-center">
                        {passportPreview ? (
                          <img src={passportPreview} alt="Preview" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xs text-cyber-text-muted text-center p-2">Passport Preview</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-cyber-border pt-6 flex justify-end">
                  <button
                    type="submit"
                    disabled={isGenerating || !profile?.generation_balance || profile.generation_balance <= 0}
                    className="cyber-button text-sm sm:text-base w-full sm:w-auto px-6 py-3 sm:py-2.5 font-bold flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" /> Compiling Engine...
                      </>
                    ) : (
                      <>
                        <Plus className="h-5 w-5" /> Compile Certificate
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Generated Certificates List */}
            <div className="cyber-panel p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-white mb-6 border-b border-cyber-border pb-2">
                My Generated Documents
              </h2>

              {myTests.length === 0 ? (
                <div className="text-center py-12 text-cyber-text-muted text-sm">
                  No generated certificates found on this account.
                </div>
              ) : (
                <>
                  {/* Mobile/Tablet Card View */}
                  <div className="space-y-4 md:hidden">
                    {myTests.map((test) => (
                      <div key={test.id} className="p-4 border border-cyber-border/40 rounded bg-cyber-surface/10 space-y-3">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <span className="text-[10px] uppercase text-cyber-text-muted font-mono font-bold block">Candidate Name</span>
                            <span className="font-bold text-white uppercase text-sm block">{test.name}</span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[10px] uppercase text-cyber-text-muted font-mono font-bold block">Downloads</span>
                            <span className="text-sm font-bold text-cyber-primary">{test.download_count}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-cyber-text-muted font-mono font-bold uppercase block">Cert Number</span>
                            <span className="text-cyber-primary font-mono">{test.certificate_number}</span>
                          </div>
                          <div>
                            <span className="text-cyber-text-muted font-mono font-bold uppercase block">Generated At</span>
                            <span className="text-cyber-text-muted">{new Date(test.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2 border-t border-cyber-border/20">
                          <button
                            onClick={() => {
                              setActiveTest(test);
                              setPreviewOpen(true);
                            }}
                            className="flex-1 text-center text-xs text-cyber-primary hover:underline border border-cyber-primary/20 py-2 rounded bg-cyber-primary/5 cursor-pointer font-semibold"
                          >
                            Preview
                          </button>
                          <button
                            onClick={() => handleDownloadPDF(test.id)}
                            className="flex-1 text-center text-xs text-cyber-success hover:underline border border-cyber-success/20 py-2 rounded bg-cyber-success/5 inline-flex items-center justify-center gap-1 cursor-pointer font-semibold"
                          >
                            <Download className="h-3 w-3" /> Save PDF
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-cyber-border text-xs uppercase tracking-wider text-cyber-text-muted">
                          <th className="pb-3 font-bold whitespace-nowrap">Candidate Name</th>
                          <th className="pb-3 font-bold whitespace-nowrap">Cert Number</th>
                          <th className="pb-3 font-bold text-center whitespace-nowrap">Downloads</th>
                          <th className="pb-3 font-bold whitespace-nowrap">Generated At</th>
                          <th className="pb-3 font-bold text-right whitespace-nowrap">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-cyber-border/40 text-sm">
                        {myTests.map((test) => (
                          <tr key={test.id} className="hover:bg-cyber-surface/20">
                            <td className="py-3 font-bold text-white uppercase whitespace-nowrap pr-4">{test.name}</td>
                            <td className="py-3 text-cyber-primary font-mono whitespace-nowrap pr-4">{test.certificate_number}</td>
                            <td className="py-3 text-center whitespace-nowrap pr-4">{test.download_count}</td>
                            <td className="py-3 text-cyber-text-muted text-xs whitespace-nowrap pr-4">
                              {new Date(test.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setActiveTest(test);
                                    setPreviewOpen(true);
                                  }}
                                  className="text-xs text-cyber-primary hover:underline border border-cyber-primary/20 px-2.5 py-1.5 rounded bg-cyber-primary/5 cursor-pointer whitespace-nowrap"
                                >
                                  Preview
                                </button>
                                <button
                                  onClick={() => handleDownloadPDF(test.id)}
                                  className="text-xs text-cyber-success hover:underline border border-cyber-success/20 px-2.5 py-1.5 rounded bg-cyber-success/5 inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                >
                                  <Download className="h-3 w-3" /> Save PDF
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

          </div>

        </div>
      </main>

      {/* Preview Modal Overlay (Responsive, High Quality) */}
      {previewOpen && activeTest && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
          <div className="cyber-panel bg-cyber-surface-card max-w-5xl w-full h-[90vh] sm:h-[85vh] flex flex-col overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-6 py-4 border-b border-cyber-border bg-cyber-surface gap-4">
              <div className="w-full sm:w-auto">
                <h3 className="font-bold text-white text-base">Document Preview</h3>
                <span className="text-xs text-cyber-text-muted font-mono break-all">{activeTest.certificate_number}</span>
              </div>
              <div className="flex flex-col sm:flex-row w-full sm:w-auto items-stretch sm:items-center gap-2 sm:gap-3">
                <button
                  onClick={() => handleDownloadPDF(activeTest.id)}
                  className="cyber-button text-xs px-4 py-2 sm:py-1.5 flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" /> Download Certificate
                </button>
                <button
                  onClick={() => setPreviewOpen(false)}
                  className="text-cyber-text-muted hover:text-white border border-cyber-border px-3 py-2 sm:py-1.5 rounded text-xs text-center"
                >
                  Close Preview
                </button>
              </div>
            </div>
            
            {/* Web View Document Wrapper */}
            <div className="flex-1 bg-neutral-900 overflow-y-auto p-2 sm:p-4 flex justify-center">
              <iframe
                src={documentApi.getRenderUrl(activeTest.id)}
                title="Drug Test Certificate Preview"
                className="w-full max-w-4xl min-h-[60vh] h-full border border-cyber-border bg-white rounded shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

