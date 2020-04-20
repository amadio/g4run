#include <G4FieldManager.hh>
#include <G4SystemOfUnits.hh>
#include <G4TransportationManager.hh>
#include <G4UniformMagField.hh>

static inline G4FieldManager *field_manager()
{
	return G4TransportationManager::GetTransportationManager()->GetFieldManager();
}

void set_uniform_magnetic_field(double Bx, double By, double Bz)
{
	auto magnetic_field = G4ThreeVector(Bx, By, Bz) * tesla;

	if (magnetic_field.mag2() > 0.0) {
		auto field = new G4UniformMagField(magnetic_field);
		field_manager()->SetDetectorField(field);
		field_manager()->CreateChordFinder(field);
	}
}
