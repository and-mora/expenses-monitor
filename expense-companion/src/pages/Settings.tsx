import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { List, CalendarDays, Moon, Sun } from 'lucide-react';

const LAYOUT_STORAGE_KEY = 'transactions-layout';
type TransactionsLayout = 'list' | 'timeline';

const Settings = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [layout, setLayout] = useState<TransactionsLayout>(() => {
    if (typeof window === 'undefined') return 'timeline';
    const stored = window.localStorage.getItem(LAYOUT_STORAGE_KEY) as TransactionsLayout | null;
    return stored === 'list' || stored === 'timeline' ? stored : 'timeline';
  });

  // Avoid hydration mismatch by only rendering theme UI after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, layout);
  }, [layout]);

  return (
    <div className="min-h-screen bg-background">
      <Header className="border-b bg-card/80 backdrop-blur-xs sticky top-0 z-50" />
      
      <main className="container px-4 py-6 pb-24 md:px-6 md:py-8 md:pb-8 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Customize your experience
          </p>
        </div>

        <div className="space-y-6">
          {/* Theme Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize the look and feel of the app
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    {mounted && resolvedTheme === 'dark' ? (
                      <Moon className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Sun className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <Label htmlFor="dark-mode" className="text-base font-medium">Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      {mounted && resolvedTheme === 'dark' ? 'Currently using dark theme' : 'Currently using light theme'}
                    </p>
                  </div>
                </div>
                <Switch
                  id="dark-mode"
                  checked={mounted && resolvedTheme === 'dark'}
                  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                  aria-label="Toggle dark mode"
                />
              </div>
            </CardContent>
          </Card>

          {/* Display Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Display</CardTitle>
              <CardDescription>
                Choose how transactions are displayed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-base mb-3 block">Transaction Layout</Label>
                  <RadioGroup
                    value={layout}
                    onValueChange={(value) => setLayout(value as TransactionsLayout)}
                    className="grid grid-cols-1 gap-3"
                  >
                    <Label
                      htmlFor="layout-timeline"
                      className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors [&:has(:checked)]:border-primary [&:has(:checked)]:bg-primary/5"
                    >
                      <RadioGroupItem value="timeline" id="layout-timeline" />
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <CalendarDays className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Timeline</p>
                        <p className="text-sm text-muted-foreground">
                          Transactions grouped by date with swipe actions
                        </p>
                      </div>
                    </Label>

                    <Label
                      htmlFor="layout-list"
                      className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors [&:has(:checked)]:border-primary [&:has(:checked)]:bg-primary/5"
                    >
                      <RadioGroupItem value="list" id="layout-list" />
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <List className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">List</p>
                        <p className="text-sm text-muted-foreground">
                          Traditional table view with all details visible
                        </p>
                      </div>
                    </Label>
                  </RadioGroup>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Settings;
