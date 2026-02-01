import { DayDetailView } from "@/components/dashboard/day-detail-view";

// Required for Static Export (GitHub Pages)
// Generates /0, /1, ... /6
export function generateStaticParams() {
    return Array.from({ length: 7 }, (_, i) => ({
        day: i.toString(),
    }));
}

export default function DayDetailPage({ params }: { params: { day: string } }) {
    return <DayDetailView dayIndex={parseInt(params.day)} />;
}
