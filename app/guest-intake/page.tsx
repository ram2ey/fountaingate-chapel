import { UnavailableState } from '../../components/common/UnavailableState';

export default function GuestIntakePage() {
  return (
    <UnavailableState
      title="Guest registration temporarily unavailable"
      description="Online guest registration is currently unavailable. Please speak with the welcome team at church."
    />
  );
}
