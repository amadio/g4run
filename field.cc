#include "field.h"

#include <G4TwoVector.hh>
#include <G4MagneticField.hh>
#include <G4SystemOfUnits.hh>
#include <G4UniformMagField.hh>

#include <cmath>
#include <fstream>
#include <stdexcept>

#include <err.h>
#include <unistd.h>

static const int nbinR = 900 + 1;
static const int nbinZ = 2 * 1600 + 1;
static const int noffZ = 1600;

static const double minR = 0.0;
static const double maxR = 9000.0;
static const double minZ = -16000.0;
static const double maxZ = 16000.0;

static const double trackerRmax = 3000.0;
static const double trackerZmax = 3000.0;

static const double params[] = {
	4.24326,    15.0201,     3.81492,
	0.0178712,  0.000656527, 2.45818,
	0.00778695, 2.12500,     1.7743600};

static const double ap2 = 4.0 * (params[0] * params[0]) / (params[1] * params[1]);
static const double hb0 = 0.5 * params[2] * std::sqrt(1.0 + ap2);
static const double hlova = 1.0 / std::sqrt(ap2);
static const double ainv = 2.0 * hlova / params[1];
static const double coeff = 1.0 / (params[8] * params[8]);

class CMSMagneticField : public G4MagneticField
{
	public:
		CMSMagneticField() = delete;
		CMSMagneticField(const char *filename);

		~CMSMagneticField();

		void GetFieldValue(const G4double *point, double *B) const final;

	private:
		G4TwoVector **fieldMap;
};

CMSMagneticField::CMSMagneticField(const char *filename) {
	using std::ios;
	using std::ifstream;

	ifstream input(filename, ios::in | ios::binary | ios::ate);

	if (!input.is_open())
		throw std::runtime_error("Error opening field map file");

	struct { int iz; int ir; float Bz; float Br; } fd;

	long n = input.tellg() / sizeof(fd);

	// prepare fieldMap array: fieldMap[nbinZ][nbinR];
	fieldMap = (G4TwoVector **)malloc(nbinZ * sizeof(G4TwoVector *));
	for (int j = 0; j < nbinZ; j++)
		fieldMap[j] = (G4TwoVector *)malloc(nbinR * sizeof(G4TwoVector));

	input.seekg(0, ios::beg);

	for (long i = 0; i < n; i++) {

		input.read((char *)&fd, sizeof(fd));

		if (abs(fd.iz) > noffZ || fd.ir > nbinR || !input.good())
			throw std::runtime_error("Error reading field map file");

		fieldMap[noffZ + fd.iz][fd.ir].set(fd.Bz, fd.Br);
	}

	input.close();
}

CMSMagneticField::~CMSMagneticField() {
	if (!fieldMap)
		return;

	for (int i = 0; i < nbinZ; i++)
		free(fieldMap[i]);
	free(fieldMap);

	fieldMap = nullptr;
}

static void ffunkti(double u, double *ff) {
	// Function and its 3 derivatives
	double a = 1.0 / (1.0 + u * u);
	double b = std::sqrt(a);

	ff[0] = u * b;
	ff[1] = a * b;
	ff[2] = -3.0 * u * a * ff[1];
	ff[3] = a * ff[2] * ((1.0 / u) - 4.0 * u);
}

static void tracker_parametric_field(double x, double y, double z, double r, double *B) {
	double rinv = (r > 0.0) ? 1.0 / r : 0.0;

	B[0] = x * tesla * rinv;
	B[1] = y * tesla * rinv;
	B[2] = tesla;

	// convert to m (CMS magnetic field parameterization)
	r *= 0.001;
	z *= 0.001;

	z -= params[3]; // max Bz point is shifted in z

	double az = std::abs(z);
	double zainv = z * ainv;
	double u = hlova - zainv;
	double v = hlova + zainv;
	double fu[4], gv[4];

	ffunkti(u, fu);
	ffunkti(v, gv);

	double rat = 0.5 * r * ainv;
	double rat2 = rat * rat;

	double Br = hb0 * rat * (fu[1] - gv[1] - (fu[3] - gv[3]) * rat2 * 0.5);
	double Bz = hb0 * (fu[0] + gv[0] - (fu[2] + gv[2]) * rat2);

	double corBr = params[4] * r * z * (az - params[5]) * (az - params[5]);
	double corBz = -params[6] * (exp(-(z - params[7]) * (z - params[7]) * coeff) +
			exp(-(z + params[7]) * (z + params[7]) * coeff));

	B[0] *= Br + corBr;
	B[1] *= Br + corBr;
	B[2] *= Bz + corBz;
}

static void get_field_from_map(const double *x, double r, double *B, G4TwoVector **fieldMap) {
	// unit conversion: [mm] to [cm]
	double rho = 0.1 * r;
	double z = 0.1 * x[2];

	// volume based magnetic field map - [0:900][-1600:1600] grid in [r][z]
	int ir = int(rho);
	double dr = rho - ir;

	// The previous implementation was:
	//    G4int iz = int(x[2]) + cmsExp::noffZ;
	// the main issue is that since x[2] can be negative then
	// the rounding off is sometimes 'greater' than x[2]
	int iz = int(z + noffZ);

	// The previous implementation was:
	//    G4double dz = x[2]- int(x[2]);
	// the main issue is that sicne x[2] can be negative then,
	// dz can be negative (which is fatal for the interpolation!
	double dz = z + noffZ - iz;

	double Bz_lb = fieldMap[iz][ir].x();
	double Bz_ub = fieldMap[iz + 1][ir].x();

	B[2] = (Bz_lb + (Bz_ub - Bz_lb) * dz) * tesla;

	if (rho > 0) {
		double Br_lb = fieldMap[iz][ir].y();
		double Br_ub = fieldMap[iz][ir + 1].y();
		double Br = (Br_lb + (Br_ub - Br_lb) * dr) * (tesla / rho);
		B[0] = x[0] * Br;
		B[1] = x[1] * Br;
	}
}

void CMSMagneticField::GetFieldValue(const G4double *x, double *B) const {
	double rho = std::sqrt(x[0] * x[0] + x[1] * x[1]);
	bool no_field = std::fabs(x[2]) > maxZ || rho > maxR;

	if (no_field) {
		B[0] = B[1] = B[2] = 0.0;
		return;
	}

	bool in_tracker = std::abs(x[2]) < trackerZmax && rho < trackerRmax;

	if (in_tracker) {
		tracker_parametric_field(x[0], x[1], x[2], rho, B);
	} else {
		get_field_from_map(x, rho, B, fieldMap);
	}
}

G4MagneticField *create_magnetic_field(const char *options)
{
	if (!options)
		return nullptr;

	if (strncmp(options, "file", 4) == 0) {
		const char *fmap = strchr(options, ':') + 1;

		if (access(fmap, R_OK))
			err(errno, "%s", fmap);

		return new CMSMagneticField(fmap);
	}

	double Bx = 0.0;
	double By = 0.0;
	double Bz = 0.0;

	if (strncmp(options, "B=", 2) == 0) {
		char *ptr = strdup(options), *opt = ptr;
		Bx = std::strtod(opt + 2, &opt);
		By = std::strtod(opt + 1, &opt);
		Bz = std::strtod(opt + 1, nullptr);
		free(ptr);
	} else {
		Bz = std::strtod(options, nullptr);
	}

	G4ThreeVector B(Bx * tesla, By * tesla, Bz * tesla);

	return B.mag2() > 0.0 ? new G4UniformMagField(B) : nullptr;
}
