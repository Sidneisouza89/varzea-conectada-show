import { MapPin, Calendar, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MatchCardProps {
  homeTeam: string;
  awayTeam: string;
  stadium: string;
  time: string;
  championship: string;
  status: 'live' | 'upcoming' | 'finished';
  score?: string;
}

const MatchCard = ({ 
  homeTeam, 
  awayTeam, 
  stadium, 
  time, 
  championship,
  status,
  score 
}: MatchCardProps) => {
  const statusConfig = {
    live: { text: 'AO VIVO', className: 'bg-destructive text-destructive-foreground' },
    upcoming: { text: 'PRÓXIMO', className: 'bg-accent text-accent-foreground' },
    finished: { text: 'ENCERRADO', className: 'bg-muted text-muted-foreground' }
  };

  return (
    <Card className="group cursor-pointer overflow-hidden transition-base hover:-translate-y-1 hover:shadow-lg">
      <CardContent className="p-6">
        {/* Status Badge */}
        <div className="mb-4 flex items-center justify-between">
          <Badge className={statusConfig[status].className}>
            {statusConfig[status].text}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Trophy className="h-3 w-3" />
            {championship}
          </div>
        </div>

        {/* Teams & Score */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex-1">
            <div className="text-lg font-bold">{homeTeam}</div>
            <div className="text-sm text-muted-foreground">Casa</div>
          </div>

          {score && (
            <div className="mx-4 rounded-lg bg-muted px-4 py-2">
              <div className="text-center text-2xl font-bold">{score}</div>
            </div>
          )}

          <div className="flex-1 text-right">
            <div className="text-lg font-bold">{awayTeam}</div>
            <div className="text-sm text-muted-foreground">Visitante</div>
          </div>
        </div>

        {/* Location & Time */}
        <div className="space-y-2 border-t pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{stadium}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{time}</span>
          </div>
        </div>

        {/* Hover effect indicator */}
        <div className="mt-4 text-center text-sm font-medium text-primary opacity-0 transition-base group-hover:opacity-100">
          Ver detalhes →
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchCard;
