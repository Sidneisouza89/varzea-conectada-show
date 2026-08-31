import { MapPin, Calendar, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface MatchCardProps {
  jogoId: number;
  homeTeam: string;
  homeTeamLogo?: string | null;
  awayTeam: string;
  awayTeamLogo?: string | null;
  stadium: string;
  time: string;
  championship: string;
  status: 'live' | 'upcoming' | 'finished';
  score?: string;
}

const TeamAvatar = ({ name, logo }: { name: string; logo?: string | null }) => (
  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm overflow-hidden flex-shrink-0">
    {logo ? (
      <img src={logo} alt={name} className="w-full h-full object-cover" />
    ) : (
      name[0]
    )}
  </div>
);

const MatchCard = ({ 
  jogoId,
  homeTeam, 
  homeTeamLogo,
  awayTeam, 
  awayTeamLogo,
  stadium, 
  time, 
  championship,
  status,
  score 
}: MatchCardProps) => {
  const navigate = useNavigate();
  const statusConfig = {
    live: { text: 'AO VIVO', className: 'bg-destructive text-destructive-foreground' },
    upcoming: { text: 'PRÓXIMO', className: 'bg-accent text-accent-foreground' },
    finished: { text: 'ENCERRADO', className: 'bg-muted text-muted-foreground' }
  };
  return (
    <Card
      className="group cursor-pointer overflow-hidden transition-base hover:-translate-y-1 hover:shadow-lg"
      onClick={() => navigate(`/jogos/${jogoId}`)}
    >
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
          <div className="flex-1 flex items-center gap-2">
            <TeamAvatar name={homeTeam} logo={homeTeamLogo} />
            <div>
              <div className="text-lg font-bold leading-tight">{homeTeam}</div>
              <div className="text-sm text-muted-foreground">Casa</div>
            </div>
          </div>
          {score ? (
            <div className="mx-4 rounded-lg bg-muted px-4 py-2">
              <div className="text-center text-2xl font-bold">{score}</div>
            </div>
          ) : (
            <div className="mx-4 text-muted-foreground font-bold text-xl">VS</div>
          )}
          <div className="flex-1 flex items-center gap-2 justify-end text-right">
            <div>
              <div className="text-lg font-bold leading-tight">{awayTeam}</div>
              <div className="text-sm text-muted-foreground">Visitante</div>
            </div>
            <TeamAvatar name={awayTeam} logo={awayTeamLogo} />
          </div>
        </div>
        {/* Location & Time */}
        <div className="space-y-2 border-t pt-4">
          {stadium && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{stadium}</span>
            </div>
          )}
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
