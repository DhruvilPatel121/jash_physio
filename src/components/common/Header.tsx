import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Activity, Menu, Home, Users, LogOut, User } from "lucide-react";

export default function Header() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const navItems = [
    { path: "/", label: "Dashboard", icon: Home },
    { path: "/patients", label: "Patients", icon: Users },
  ];

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          {/* Mobile Menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-2 mb-6">
                  {/* <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                    <Activity className="w-5 h-5 text-primary-foreground" />
                  </div> */}
                  <div className="flex justify-center mb-4">
                    <img
                      src="images/logo/logo.png"
                      alt="Jash Physiotherapy Logo"
                      className="h-20 w-auto object-contain"
                    />
                  </div>
                  {/* <div>
                    <h2 className="font-bold">Jash Physio</h2>
                    <p className="text-xs text-muted-foreground">
                      Patient Management
                    </p>
                  </div> */}
                </div>
                <nav className="flex-1 space-y-2">
                  {navItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive(item.path)
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent"
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </nav>
                {user && (
                  <div className="border-t pt-4 space-y-3">
                    <div className="px-3">
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {user.email}
                      </p>
                      <Badge variant="secondary" className="mt-2">
                        {user.role}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleSignOut}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            {/* <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary-foreground" />
            </div> */}
            <div className="flex justify-center mb-4">
              <img
                src="images/logo/logo.png"
                alt="Jash Physiotherapy Logo"
                className="h-20 w-36 object-contain"
              />
            </div>

            <div className="hidden sm:block">
              {/* <h1 className="font-bold text-lg">Jash Physiotherapy</h1>
              <p className="text-xs text-muted-foreground">
                Patient Management
              </p> */}
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-2">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path}>
              <Button
                variant={isActive(item.path) ? "default" : "ghost"}
                className="gap-2"
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>

        {/* User Menu */}
        {user && (
          <div className="hidden lg:flex items-center gap-4">
            <div className="text-right">
              <p className="font-semibold text-sm">{user.name}</p>
              <Badge variant="secondary" className="text-xs">
                {user.role}
              </Badge>
            </div>
            <Button variant="outline" size="icon" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
