import React, { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, X, CircleSlash } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface AttendanceCalendarProps {
  attendance: Record<string, "present" | "absent"> | undefined;
  archivedDates?: string[];
  onAttendanceChange: (date: Date, status: "present" | "absent" | null) => void;
  isLocked?: boolean;
}

export function AttendanceCalendar({
  attendance = {},
  archivedDates = [],
  onAttendanceChange,
  isLocked = false,
}: AttendanceCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDayClick = (date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    const isArchived = archivedDates.includes(dateKey);
    const hasStatus = !!attendance[dateKey];

    // 1) Archived dates are ALWAYS locked
    if (isArchived) return;

    // 2) If the session limit is reached (isLocked), we ONLY allow clicking
    //    on days that already have a status (to allow fixing mistakes/unmarking).
    //    We prevent clicking on NEW (empty) days.
    if (isLocked && !hasStatus) return;

    setSelectedDate(date);
    setIsDialogOpen(true);
  };

  const handleStatusSelect = (status: "present" | "absent" | null) => {
    if (selectedDate) {
      onAttendanceChange(selectedDate, status);
      setIsDialogOpen(false);
    }
  };

  // Custom DayContent to show indicators
  const DayContent = (props: any) => {
    const { date } = props;
    const dateKey = format(date, "yyyy-MM-dd");
    const status = attendance[dateKey];
    const isArchived = archivedDates.includes(dateKey);

    return (
      <div
        className={cn(
          "relative w-full h-full flex items-center justify-center p-2",
          isArchived && "opacity-40 bg-slate-100 cursor-not-allowed grayscale",
        )}
      >
        <span className={isArchived ? "font-normal" : ""}>
          {date.getDate()}
        </span>
        {status === "present" && (
          <div className="absolute bottom-1 right-1">
            <Check
              className={cn(
                "w-3 h-3 text-green-600",
                isArchived && "text-slate-500",
              )}
              strokeWidth={4}
            />
          </div>
        )}
        {status === "absent" && (
          <div className="absolute bottom-1 right-1">
            <X
              className={cn(
                "w-3 h-3 text-red-600",
                isArchived && "text-slate-500",
              )}
              strokeWidth={4}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="flex justify-center border rounded-md p-4 bg-card text-card-foreground shadow-sm">
        <Calendar
          mode="single"
          selected={selectedDate}
          onDayClick={handleDayClick}
          components={{
            DayContent: DayContent,
          }}
          className="rounded-md border"
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-center">
              {selectedDate
                ? format(selectedDate, "MMMM d, yyyy")
                : "Select Date"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-center gap-4 py-4">
            <Button
              variant={
                attendance[
                  selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""
                ] === "present"
                  ? "default"
                  : "outline"
              }
              className={cn(
                "flex flex-col h-20 w-20 gap-2",
                attendance[
                  selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""
                ] === "present" && "bg-green-600 hover:bg-green-700",
              )}
              onClick={() => handleStatusSelect("present")}
              disabled={
                isLocked &&
                attendance[
                  selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""
                ] !== "present"
              }
            >
              <Check className="w-8 h-8" />
              <span>Present</span>
            </Button>
            <Button
              variant={
                attendance[
                  selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""
                ] === "absent"
                  ? "default"
                  : "outline"
              }
              className={cn(
                "flex flex-col h-20 w-20 gap-2",
                attendance[
                  selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""
                ] === "absent" && "bg-red-600 hover:bg-red-700",
              )}
              onClick={() => handleStatusSelect("absent")}
            >
              <X className="w-8 h-8" />
              <span>Absent</span>
            </Button>
          </div>
          <DialogFooter className="sm:justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleStatusSelect(null)}
            >
              <CircleSlash className="w-4 h-4 mr-2" />
              Clear Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
