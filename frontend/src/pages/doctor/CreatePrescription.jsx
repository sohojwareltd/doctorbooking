import Prescription from './Prescription';

export default function CreatePrescription(props) {
  return <Prescription mode="create" defaultTemplateType="general" {...props} />;
}
