import React, { useState } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, X, CircleSlash } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface AttendanceCalendarProps {
  attendance: Record<string, 'present' | 'absent'> | undefined;
  onAttendanceChange: (date: Date, status: 'present' | 'absent' | null) => void;
}

export function AttendanceCalendar({ attendance = {}, onAttendanceChange }: AttendanceCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setIsDialogOpen(true);
  };

  const handleStatusSelect = (status: 'present' | 'absent' | null) => {
    if (selectedDate) {
      onAttendanceChange(selectedDate, status);
      setIsDialogOpen(false);
    }
  };

  // Custom DayContent to show indicators
  const DayContent = (props: any) => {
    const { date } = props;
    const dateKey = format(date, 'yyyy-MM-dd');
    const status = attendance[dateKey];

    return (
      <div className="relative w-full h-full flex items-center justify-center p-2">
        <span>{date.getDate()}</span>
        {status === 'present' && (
          <div className="absolute bottom-1 right-1">
             <Check className="w-3 h-3 text-green-600" strokeWidth={4} />
          </div>
        )}
        {status === 'absent' && (
           <div className="absolute bottom-1 right-1">
             <X className="w-3 h-3 text-red-600" strokeWidth={4} />
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
               DayContent: DayContent
            }}
            className="rounded-md border"
         />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-center">
              {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select Date'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-center gap-4 py-4">
             <Button 
                variant={attendance[selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''] === 'present' ? 'default' : 'outline'}
                className={cn("flex flex-col h-20 w-20 gap-2", attendance[selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''] === 'present' && "bg-green-600 hover:bg-green-700")}
                onClick={() => handleStatusSelect('present')}
             >
                <Check className="w-8 h-8" />
                <span>Present</span>
             </Button>
             <Button 
                variant={attendance[selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''] === 'absent' ? 'default' : 'outline'}
                className={cn("flex flex-col h-20 w-20 gap-2", attendance[selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''] === 'absent' && "bg-red-600 hover:bg-red-700")}
                onClick={() => handleStatusSelect('absent')}
             >
                <X className="w-8 h-8" />
                <span>Absent</span>
             </Button>
          </div>
          <DialogFooter className="sm:justify-center">
             <Button variant="ghost" size="sm" onClick={() => handleStatusSelect(null)}>
                <CircleSlash className="w-4 h-4 mr-2" />
                Clear Status
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
