#include "field.h"
#include "geometry.h"

#include <G4GDMLParser.hh>
#include <G4FieldManager.hh>
#include <G4TransportationManager.hh>
#include <G4UniformMagField.hh>

#include <err.h>
#include <unistd.h>
#include <cstdio>

static G4FieldManager *field_manager()
{
	return G4TransportationManager::GetTransportationManager()->GetFieldManager();
}

static G4VPhysicalVolume *load_gdml(const char *gdml)
{
	if (access(gdml, R_OK))
		err(errno, "%s", gdml);

	G4GDMLParser p;

	p.Read(gdml, /* validate */ false);

	auto world = p.GetWorldVolume();

	if (!world)
		errx(1, "error reading geometry file");

	return world;
}

DetectorConstruction::DetectorConstruction(const char *gdml, const char *fieldopts)
{
	world = load_gdml(gdml);
	field = create_magnetic_field(fieldopts);
}

G4VPhysicalVolume *DetectorConstruction::Construct()
{
	return world;
}

void DetectorConstruction::ConstructSDandField()
{
	if (!field)
		return;

	field_manager()->SetDetectorField(field);
	field_manager()->CreateChordFinder(field);
}
