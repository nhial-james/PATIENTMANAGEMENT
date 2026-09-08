import { useState, useEffect } from 'react';
import { shaApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Shield,
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Send,
  RefreshCw,
} from 'lucide-react';

export function HospitalSHA() {
  const [nationalId, setNationalId] = useState('28934512');
  const [memberNumber, setMemberNumber] = useState('SHA-88239011');
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);

  const [claims, setClaims] = useState<any[]>([]);
  const [loadingClaims, setLoadingClaims] = useState(true);

  // New claim form
  const [encounterId, setEncounterId] = useState('');
  const [claimAmount, setClaimAmount] = useState('4500');
  const [diagCode, setDiagCode] = useState('B54');
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);

  const fetchClaims = async () => {
    try {
      setLoadingClaims(true);
      const data = await shaApi.getClaims();
      setClaims(data);
    } catch (err) {
      console.error('Failed to load SHA claims:', err);
    } finally {
      setLoadingClaims(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setVerifying(true);
      const res = await shaApi.verifyEligibility(nationalId, memberNumber);
      setVerificationResult(res);
    } catch (err: any) {
      alert(err.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!encounterId) {
      alert('Encounter ID is required');
      return;
    }
    try {
      setSubmittingClaim(true);
      const res = await shaApi.submitClaim({
        encounterId,
        memberNumber,
        claimedAmount: parseFloat(claimAmount),
        diagnosisCodes: [diagCode],
      });
      setClaimSuccess(`Claim submitted successfully! Ref: ${res.claimReference}`);
      fetchClaims();
    } catch (err: any) {
      alert(err.message || 'Failed to submit claim');
    } finally {
      setSubmittingClaim(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Module Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Social Health Authority (SHA) Gateway</h2>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs">
              Adapter: Active (Simulation)
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Universal health coverage biometric/ID eligibility verification, e-claims submission, and reconciliation
          </p>
        </div>
        <Button onClick={fetchClaims} variant="outline" size="sm" className="gap-1.5 text-xs">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Claims
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Verification Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Real-time SHA Eligibility Verification
            </CardTitle>
            <CardDescription className="text-xs">
              Check patient biometric coverage, tier benefits, and active validity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleVerify} className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">National ID Number / Passport</Label>
                <Input
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  placeholder="e.g. 28934512"
                  className="text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">SHA Member Number (Optional)</Label>
                <Input
                  value={memberNumber}
                  onChange={(e) => setMemberNumber(e.target.value)}
                  placeholder="e.g. SHA-88239011"
                  className="text-xs"
                />
              </div>

              <Button type="submit" size="sm" className="w-full gap-2 text-xs" disabled={verifying}>
                <Search className="w-3.5 h-3.5" />
                {verifying ? 'Querying SHA Gateway...' : 'Verify Beneficiary Eligibility'}
              </Button>
            </form>

            {verificationResult && (
              <div className="mt-4 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-700 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Active Beneficiary Confirmed
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 text-muted-foreground">
                  <div>
                    <span className="block text-[10px] uppercase font-semibold">Beneficiary:</span>
                    <span className="text-foreground font-medium">{verificationResult.beneficiaryName}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-semibold">Member #:</span>
                    <span className="text-foreground font-mono">{verificationResult.memberNumber}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-semibold">Scheme Tier:</span>
                    <span className="text-foreground">{verificationResult.schemeTier}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-semibold">Valid Until:</span>
                    <span className="text-foreground">{verificationResult.validUntil}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Claim Submission Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Send className="w-4 h-4 text-primary" />
              Prepare & Transmit SHA E-Claim
            </CardTitle>
            <CardDescription className="text-xs">
              Package clinical diagnoses and invoiced services for automated SHA reimbursement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitClaim} className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Encounter Number / ID</Label>
                <Input
                  value={encounterId}
                  onChange={(e) => setEncounterId(e.target.value)}
                  placeholder="e.g. Enter Encounter UUID or Number"
                  className="text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Claim Amount (KES)</Label>
                  <Input
                    type="number"
                    value={claimAmount}
                    onChange={(e) => setClaimAmount(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Primary ICD-10 Code</Label>
                  <Input
                    value={diagCode}
                    onChange={(e) => setDiagCode(e.target.value)}
                    placeholder="e.g. B54"
                    className="text-xs"
                    required
                  />
                </div>
              </div>

              {claimSuccess && (
                <div className="p-2.5 bg-emerald-100 text-emerald-800 text-xs rounded-lg font-medium">
                  {claimSuccess}
                </div>
              )}

              <Button type="submit" size="sm" className="w-full gap-2 text-xs" disabled={submittingClaim}>
                <Send className="w-3.5 h-3.5" />
                {submittingClaim ? 'Transmitting Claim...' : 'Submit Claim to SHA'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Submitted Claims History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">SHA Claims Reconciliation</CardTitle>
          <CardDescription className="text-xs">
            Historical claims status, response codes, and settlement tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingClaims ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading claims...</div>
          ) : claims.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No claims submitted yet. Use the form above to prepare an e-claim.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 text-muted-foreground border-b">
                  <tr>
                    <th className="p-3">Claim Reference</th>
                    <th className="p-3">Member #</th>
                    <th className="p-3">Patient</th>
                    <th className="p-3">Claimed Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Response Ack</th>
                    <th className="p-3">Submitted At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {claims.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-mono font-medium text-foreground">{c.claimReference}</td>
                      <td className="p-3 font-mono text-muted-foreground">{c.memberNumber}</td>
                      <td className="p-3 font-medium text-foreground">
                        {c.encounter?.patient?.fullName || 'Beneficiary'}
                      </td>
                      <td className="p-3 font-bold text-foreground">KES {c.claimedAmount?.toLocaleString()}</td>
                      <td className="p-3">
                        <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-emerald-200">
                          {c.status}
                        </Badge>
                      </td>
                      <td className="p-3 font-mono text-xs text-muted-foreground">{c.responseCode || 'SHA-ACK-OK'}</td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(c.submittedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
