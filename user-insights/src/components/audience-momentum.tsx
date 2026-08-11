import { ArrowDownRight, ArrowUpRight, Gauge } from "lucide-react";
import { Area, AreaChart } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  getCountryMomentum,
  getGrowthData,
  type Period,
  type UserCity,
} from "@/data/insights";
import { cn, compactNumber } from "@/lib/utils";

const momentumConfig = {
  users: { label: "Audience", color: "var(--mint)" },
} satisfies ChartConfig;

const periodLabels: Record<Period, string> = {
  "7d": "7 days",
  "28d": "28 days",
  "90d": "90 days",
};

export function AudienceMomentum({
  cities,
  period,
  selectedCountry,
  onCountrySelect,
}: {
  cities: UserCity[];
  period: Period;
  selectedCountry: string | null;
  onCountrySelect: (country: string) => void;
}) {
  const { benchmark, countries } = getCountryMomentum(period, cities);
  const fastest = countries[0];
  const fastestCities = fastest
    ? cities.filter((city) => city.country === fastest.country)
    : [];
  const trend = getGrowthData(period, fastestCities);
  const gaining = countries
    .filter((country) => country.momentum >= 0)
    .slice(0, 3);
  const losing = countries
    .filter((country) => country.momentum < 0)
    .slice(-3)
    .reverse();

  return (
    <Card id="audience-momentum" className="analytics-card momentum-card">
      <CardHeader className="analytics-header momentum-header">
        <div>
          <CardTitle>Audience momentum</CardTitle>
          <CardDescription>
            Countries moving faster or slower than the selected region’s pace.
          </CardDescription>
        </div>
        <div className="momentum-period" aria-label="Selected time period">
          <Gauge aria-hidden="true" />
          {periodLabels[period]}
        </div>
      </CardHeader>
      <CardContent className="momentum-content">
        {fastest && (
          <section
            className="momentum-leader"
            aria-label={`Fastest-growing country: ${fastest.country}`}
          >
            <span className="momentum-eyebrow">Fastest growth</span>
            <div className="momentum-leader-heading">
              <span className="momentum-leader-flag">{fastest.flag}</span>
              <div>
                <h3>{fastest.country}</h3>
                <span>{periodLabels[period]} audience pace</span>
              </div>
              <strong>+{fastest.pace.toFixed(1)}%</strong>
            </div>
            <ChartContainer
              config={momentumConfig}
              className="momentum-trend"
              aria-label={`${fastest.country} audience trend over ${periodLabels[period]}`}
            >
              <AreaChart
                accessibilityLayer
                data={trend}
                margin={{ top: 7, right: 2, left: 2, bottom: 2 }}
              >
                <defs>
                  <linearGradient
                    id="momentumGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="var(--mint)"
                      stopOpacity={0.28}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--mint)"
                      stopOpacity={0.015}
                    />
                  </linearGradient>
                </defs>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="var(--mint)"
                  strokeWidth={2}
                  fill="url(#momentumGradient)"
                  dot={false}
                  isAnimationActive={false}
                  activeDot={{
                    r: 3.5,
                    fill: "var(--mint)",
                    stroke: "var(--background)",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ChartContainer>
            <div className="momentum-trend-caption">
              <span>{trend[0]?.date}</span>
              <span>{compactNumber(trend.at(-1)?.users ?? 0)} audience</span>
              <span>{trend.at(-1)?.date}</span>
            </div>
          </section>
        )}

        <div className="momentum-groups">
          <MomentumGroup
            label="Gaining momentum"
            countries={gaining}
            benchmark={benchmark}
            selectedCountry={selectedCountry}
            onCountrySelect={onCountrySelect}
          />
          <MomentumGroup
            label="Losing momentum"
            countries={losing}
            benchmark={benchmark}
            selectedCountry={selectedCountry}
            onCountrySelect={onCountrySelect}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function MomentumGroup({
  label,
  countries,
  benchmark,
  selectedCountry,
  onCountrySelect,
}: {
  label: string;
  countries: ReturnType<typeof getCountryMomentum>["countries"];
  benchmark: number;
  selectedCountry: string | null;
  onCountrySelect: (country: string) => void;
}) {
  return (
    <section className="momentum-group" aria-label={label}>
      <div className="momentum-group-heading">
        <span>{label}</span>
        <span>vs. {benchmark.toFixed(1)}% pace</span>
      </div>
      <div className="momentum-list">
        {countries.map((country) => {
          const isGaining = country.momentum >= 0;
          const isSelected = selectedCountry === country.country;

          return (
            <button
              key={country.country}
              type="button"
              className={cn(
                "momentum-row",
                isSelected && "momentum-row-selected",
              )}
              aria-pressed={isSelected}
              onClick={() => onCountrySelect(country.country)}
            >
              <span className="momentum-country">
                <span>{country.flag}</span>
                {country.country}
              </span>
              <span
                className={cn(
                  "momentum-change",
                  !isGaining && "momentum-change-negative",
                )}
              >
                {isGaining ? (
                  <ArrowUpRight aria-hidden="true" />
                ) : (
                  <ArrowDownRight aria-hidden="true" />
                )}
                {Math.abs(country.momentum).toFixed(1)} pts
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
