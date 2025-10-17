import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Download, Database } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';

export default function RTADataImport() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [clearExisting, setClearExisting] = useState<boolean>(true); // Default to safe mode
  
  // National data import
  const [siamMonth, setSiamMonth] = useState<number>(9);
  const [siamYear, setSiamYear] = useState<number>(2025);
  const [siamTotal, setSiamTotal] = useState<number>(372458);
  const [importingSiam, setImportingSiam] = useState(false);
  const [siamResult, setSiamResult] = useState<any>(null);
  
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        toast({
          title: 'Invalid File',
          description: 'Please select a CSV file',
          variant: 'destructive',
        });
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: 'No File Selected',
        description: 'Please select a CSV file to import',
        variant: 'destructive',
      });
      return;
    }

    setImporting(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('csv', file);
      formData.append('clearExisting', clearExisting.toString());

      const response = await fetch('/api/admin/import-rta-csv', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setResult(data);
      
      if (data.success) {
        toast({
          title: 'Import Successful',
          description: data.message,
        });
      } else {
        toast({
          title: 'Import Failed',
          description: data.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Import Error',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  const handleSiamImport = async () => {
    if (!siamTotal || siamTotal < 1) {
      toast({
        title: 'Invalid Input',
        description: 'Please enter a valid total PV sales number',
        variant: 'destructive',
      });
      return;
    }

    setImportingSiam(true);
    setSiamResult(null);

    try {
      const response = await apiRequest('/api/admin/import-siam-data', 'POST', {
        month: siamMonth,
        year: siamYear,
        totalPV: siamTotal,
      });

      setSiamResult(response);
      toast({
        title: 'Import Successful',
        description: response.message,
      });
    } catch (error) {
      toast({
        title: 'Import Error',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setImportingSiam(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `Manufacturer_Name,Model_Desc,Fuel,Apprved_Dt,Transmission
TATA MOTORS,Nexon,ELECTRIC,2025-09-15,AUTOMATIC
MAHINDRA,Scorpio,DIESEL,2025-09-16,MANUAL
MARUTI SUZUKI,Swift,PETROL,2025-09-17,MANUAL
HYUNDAI,Creta,DIESEL,2025-09-18,AUTOMATIC
KIA,Seltos,PETROL,2025-09-19,AUTOMATIC`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'telangana_rta_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Telangana RTA Data Import</h1>
        <p className="text-muted-foreground">
          Import vehicle registration data from Telangana RTA Open Data Portal CSV files
        </p>
      </div>

      <Tabs defaultValue="telangana" className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="telangana">Telangana RTA Data</TabsTrigger>
          <TabsTrigger value="national">National (SIAM) Data</TabsTrigger>
        </TabsList>

        <TabsContent value="telangana" className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Data Source:</strong> Download CSV from{' '}
              <a
                href="https://data.telangana.gov.in/dataset/regional-transport-authority-vehicle-registrations-data"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Telangana Open Data Portal
              </a>
              . The system will automatically aggregate by brand, model, and month.
            </AlertDescription>
          </Alert>

          <Card>
        <CardHeader>
          <CardTitle>Upload RTA CSV File</CardTitle>
          <CardDescription>
            Select a Telangana RTA CSV file to import. The file should contain columns: Manufacturer_Name,
            Model_Desc, Fuel, Apprved_Dt, Transmission (optional)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={importing}
              data-testid="input-csv-file"
            />
            <Button
              onClick={downloadTemplate}
              variant="outline"
              size="sm"
              data-testid="button-download-template"
            >
              <Download className="w-4 h-4 mr-2" />
              Template
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="clear-existing"
              checked={clearExisting}
              onChange={(e) => setClearExisting(e.target.checked)}
              className="h-4 w-4"
              data-testid="checkbox-clear-existing"
            />
            <Label htmlFor="clear-existing" className="text-sm">
              Clear existing data for detected months before import (recommended to prevent data loss)
            </Label>
          </div>

          {file && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="w-4 h-4" />
              <span>{file.name}</span>
              <span className="text-xs">({(file.size / 1024).toFixed(2)} KB)</span>
            </div>
          )}

          <Button
            onClick={handleImport}
            disabled={!file || importing}
            className="w-full"
            data-testid="button-import"
          >
            <Upload className="w-4 h-4 mr-2" />
            {importing ? 'Importing...' : 'Import Data'}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Import Results
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-600" />
                  Import Failed
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant={result.success ? 'default' : 'destructive'}>
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>

            {result.stats && (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Total Rows</div>
                  <div className="text-2xl font-bold">{result.stats.totalRows.toLocaleString()}</div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Imported Records</div>
                  <div className="text-2xl font-bold text-green-600">
                    {result.stats.imported.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Skipped</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {result.stats.skipped.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Errors</div>
                  <div className="text-2xl font-bold text-red-600">
                    {result.stats.errors.length}
                  </div>
                </div>
              </div>
            )}

            {result.stats?.errors && result.stats.errors.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Error Details:</h3>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {result.stats.errors.slice(0, 10).map((error: string, idx: number) => (
                    <Alert key={idx} variant="destructive" className="py-2">
                      <AlertDescription className="text-xs">{error}</AlertDescription>
                    </Alert>
                  ))}
                  {result.stats.errors.length > 10 && (
                    <p className="text-sm text-muted-foreground">
                      ... and {result.stats.errors.length - 10} more errors
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>CSV Format Guide</CardTitle>
            </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Required Columns:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>
                  <strong>Manufacturer_Name:</strong> Brand name (e.g., TATA MOTORS, MAHINDRA, MARUTI
                  SUZUKI)
                </li>
                <li>
                  <strong>Model_Desc:</strong> Model name (e.g., Nexon, Scorpio, Swift)
                </li>
                <li>
                  <strong>Fuel:</strong> Fuel type (PETROL, DIESEL, ELECTRIC, CNG, etc.)
                </li>
                <li>
                  <strong>Apprved_Dt:</strong> Approval date (formats: 2025-09-15 or 15-SEP-25)
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Optional Columns:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>
                  <strong>Transmission:</strong> MANUAL, AUTOMATIC, AMT, CVT, DCT (defaults to MANUAL)
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Brand Aggregation:</h3>
              <p className="text-sm text-muted-foreground mb-2">
                The system automatically combines sub-brands:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Tata Motors + Tata Solanis → Tata Motors</li>
                <li>Mahindra + Mahindra Electric → Mahindra</li>
                <li>Maruti + Maruti Suzuki → Maruti Suzuki</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="national" className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Data Source:</strong> SIAM (Society of Indian Automobile Manufacturers) press releases.
              Get monthly PV sales from{' '}
              <a
                href="https://www.siam.in/press-release.aspx?mpgid=48&pgidtrail=50"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                SIAM Press Releases
              </a>
              . The system will distribute across OEMs using market share estimates.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Import National Sales Data</CardTitle>
              <CardDescription>
                Enter the total Passenger Vehicle sales for a month from SIAM press releases. The system
                will distribute sales across OEMs based on market share.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="siam-month">Month</Label>
                  <Input
                    id="siam-month"
                    type="number"
                    min="1"
                    max="12"
                    value={siamMonth}
                    onChange={(e) => setSiamMonth(parseInt(e.target.value))}
                    data-testid="input-siam-month"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siam-year">Year</Label>
                  <Input
                    id="siam-year"
                    type="number"
                    min="2020"
                    max="2030"
                    value={siamYear}
                    onChange={(e) => setSiamYear(parseInt(e.target.value))}
                    data-testid="input-siam-year"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="siam-total">Total PV Sales (National)</Label>
                <Input
                  id="siam-total"
                  type="number"
                  min="1"
                  value={siamTotal}
                  onChange={(e) => setSiamTotal(parseInt(e.target.value))}
                  placeholder="e.g., 372458"
                  data-testid="input-siam-total"
                />
                <p className="text-xs text-muted-foreground">
                  Example: September 2025 = 372,458 units (from SIAM press release)
                </p>
              </div>

              <Button
                onClick={handleSiamImport}
                disabled={importingSiam}
                className="w-full"
                data-testid="button-import-siam"
              >
                <Database className="w-4 h-4 mr-2" />
                {importingSiam ? 'Importing...' : 'Import National Data'}
              </Button>

              {siamResult && (
                <Alert>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>{siamResult.message}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>OEM Market Share Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span>Maruti Suzuki:</span>
                  <span className="font-semibold">41%</span>
                </div>
                <div className="flex justify-between">
                  <span>Hyundai:</span>
                  <span className="font-semibold">15%</span>
                </div>
                <div className="flex justify-between">
                  <span>Tata Motors:</span>
                  <span className="font-semibold">14%</span>
                </div>
                <div className="flex justify-between">
                  <span>Mahindra:</span>
                  <span className="font-semibold">9%</span>
                </div>
                <div className="flex justify-between">
                  <span>Kia:</span>
                  <span className="font-semibold">7%</span>
                </div>
                <div className="flex justify-between">
                  <span>Toyota:</span>
                  <span className="font-semibold">5%</span>
                </div>
                <div className="flex justify-between">
                  <span>Honda:</span>
                  <span className="font-semibold">4%</span>
                </div>
                <div className="flex justify-between">
                  <span>MG Motor:</span>
                  <span className="font-semibold">3%</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Based on 2024-2025 market share estimates. Sales are distributed proportionally across
                OEMs.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
