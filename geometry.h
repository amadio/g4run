#ifndef _GEOMETRY_H
#define _GEOMETRY_H

#include <G4VUserDetectorConstruction.hh>

class DetectorConstruction final : public G4VUserDetectorConstruction {
public:
    DetectorConstruction() = delete;
    DetectorConstruction(const char* path) : gdml(path) {}
	G4VPhysicalVolume *Construct() override;
private:
    const char *gdml;
};

#endif
