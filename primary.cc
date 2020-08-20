#include "primary.h"

#include <G4Event.hh>
#include <G4SystemOfUnits.hh>
#include <G4ParticleTable.hh>
#include <G4PrimaryParticle.hh>
#include <G4RandomDirection.hh>

#include <err.h>

static double primary_energy;
static const char *primary_name;
static const G4ParticleDefinition *primary;

void set_primary_name(const char *name)
{
	primary_name = name;
}

void set_primary_energy(double E)
{
	primary_energy = E * GeV;
}

PrimaryGeneratorAction::PrimaryGeneratorAction()
{
	if (!(primary = G4ParticleTable::GetParticleTable()->FindParticle(primary_name)))
		errx(1, "unknown particle type: %s", primary_name);
}

void PrimaryGeneratorAction::GeneratePrimaries(G4Event* event)
{
	static const G4double time = 0.0;
	static const G4ThreeVector position(0.0, 0.0, 0.0);

	G4PrimaryVertex* vertex = new G4PrimaryVertex(position, time);
	G4PrimaryParticle* particle = new G4PrimaryParticle(primary);

	particle->SetKineticEnergy(primary_energy);
	particle->SetMomentumDirection(G4RandomDirection());
	particle->SetPolarization(0.0, 0.0, 0.0);
	vertex->SetPrimary(particle);
	event->AddPrimaryVertex(vertex);
}
