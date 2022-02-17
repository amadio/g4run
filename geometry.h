#ifndef _GEOMETRY_H
#define _GEOMETRY_H

#include <G4VUserDetectorConstruction.hh>

class DetectorConstruction final : public G4VUserDetectorConstruction {
	public:
		DetectorConstruction() = delete;
		DetectorConstruction(const char *gdml, const char *fieldopts);

		G4VPhysicalVolume *Construct() final;
		void ConstructSDandField() final;

	private:
		G4MagneticField *field;
		G4VPhysicalVolume *world;
};

#endif
